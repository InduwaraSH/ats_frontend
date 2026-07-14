import type { ICVService, UploadProgress } from '../../application/services/ICVService';
import type { MatchResult } from '../../domain/entities/MatchResult';

/**
 * Real implementation of ICVService that connects to the FastAPI backend.
 * Uses database polling for upload progress tracking (resilient to tab closure).
 */
export class CVService implements ICVService {
  private API_BASE_URL = 'http://localhost:8000/api/v1';

  /**
   * Uploads CV files to the backend and polls for progress.
   *
   * The backend accepts the files, creates placeholder application documents,
   * and processes them in a background task. This method polls a status
   * endpoint every 3 seconds until all files are processed.
   */
  async uploadCVs(
    files: File[],
    jobId: string,
    jobTitle: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<{ totalSuccess: number; totalFailed: number }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('job_id', jobId);
    formData.append('job_title', jobTitle);

    // ----- Phase 1: Submit files and get batch_id back immediately -----
    const response = await fetch(`${this.API_BASE_URL}/candidates/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = 'Upload failed';
      try {
        const errData = await response.json();
        if (errData?.detail) {
          errorMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
        }
      } catch {
        // use default error message
      }
      throw new Error(errorMessage);
    }

    const { batch_id, total_files } = await response.json();

    // ----- Signal: files are safely on the server, tab can be closed -----
    if (onProgress) {
      onProgress({
        current: 0,
        total: total_files,
        fileName: '',
        status: 'uploaded',
        batchId: batch_id,
      });
    }

    return this.pollBatchStatus(batch_id, total_files, onProgress);
  }

  /**
   * Polls the status of an existing batch upload by its ID.
   */
  async pollBatchStatus(
    batchId: string,
    totalFiles: number,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<{ totalSuccess: number; totalFailed: number }> {
    const POLL_INTERVAL_MS = 3000;

    // Track which application IDs we have already reported to onProgress
    const reportedAppIds = new Set<string>();

    return new Promise<{ totalSuccess: number; totalFailed: number }>((resolve) => {
      const poll = async () => {
        try {
          const statusRes = await fetch(
            `${this.API_BASE_URL}/candidates/upload/status/${batchId}`,
            { credentials: 'include' },
          );

          if (!statusRes.ok) {
            // Non-fatal: retry on next interval
            console.warn('Polling status failed, will retry...');
            return;
          }

          const data = await statusRes.json();

          // Report progress for applications and currently processing stages
          if (onProgress && data.applications) {
            const processingApp = data.applications.find((app: any) => app.status === 'processing');
            let newlyCompletedApp = null;

            for (const app of data.applications) {
              if (
                (app.status === 'completed' || app.status === 'failed') &&
                !reportedAppIds.has(app.application_id)
              ) {
                reportedAppIds.add(app.application_id);
                newlyCompletedApp = app;
                onProgress({
                  current: reportedAppIds.size,
                  total: totalFiles,
                  fileName: app.file_name,
                  status: app.status as 'completed' | 'failed',
                  error: app.status === 'failed' ? 'Processing failed' : undefined,
                  applicationId: app.application_id,
                  candidateName: app.candidate_name,
                  matchScore: app.match_score ?? 0,
                  urls: app.urls || [],
                  matchDetails: app.match_details,
                  currentStage: 'Completed',
                });
              }
            }

            // If we didn't just complete a file, but there is a file currently processing,
            // report its current stage so the UI updates dynamically!
            if (!newlyCompletedApp && processingApp) {
              onProgress({
                current: reportedAppIds.size,
                total: totalFiles,
                fileName: processingApp.file_name,
                status: 'uploaded',
                currentStage: processingApp.current_stage || 'Processing...',
                batchId: batchId,
              });
            }
          }

          // Check if batch is done
          if (data.status === 'completed' || data.status === 'completed_with_errors') {
            clearInterval(intervalId);
            resolve({
              totalSuccess: data.success_count ?? 0,
              totalFailed: data.fail_count ?? 0,
            });
          }
        } catch (err) {
          console.warn('Error during upload status poll:', err);
          // Don't reject — just retry on next interval
        }
      };

      // Run first poll immediately, then every POLL_INTERVAL_MS
      poll();
      const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    });
  }

  /**
   * Placeholder — detailed match analysis will be implemented with LLM scoring.
   */
  async getCVDetails(_cvId: string): Promise<MatchResult | null> {
    return null;
  }

  /**
   * Removes a CV from the evaluated candidate list.
   * Sends a DELETE request to delete the application and associated files/candidates.
   */
  async deleteCV(cvId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/applications/${cvId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      let errorMessage = 'Failed to delete CV';
      try {
        const errData = await response.json();
        if (errData?.detail) {
          errorMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
        }
      } catch {
        // use default error
      }
      throw new Error(errorMessage);
    }
  }
}
