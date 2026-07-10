import type { ICVService, UploadProgress } from '../../application/services/ICVService';
import type { MatchResult } from '../../domain/entities/MatchResult';

/**
 * Real implementation of ICVService that connects to the FastAPI backend.
 * Uses SSE (Server-Sent Events) for real-time upload progress tracking.
 */
export class CVService implements ICVService {
  private API_BASE_URL = 'http://localhost:8000/api/v1';

  /**
   * Uploads CV files to the backend and streams progress via SSE.
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

    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

    try {
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

      // Read the SSE stream
      reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable.');
      }

      const decoder = new TextDecoder();
      let totalSuccess = 0;
      let totalFailed = 0;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.type === 'progress' && onProgress) {
              onProgress({
                current: data.current,
                total: data.total,
                fileName: data.file_name,
                status: data.status,
                error: data.error,
                candidateId: data.candidate_id,
                applicationId: data.application_id,
                candidateName: data.candidate_name,
                matchScore: data.match_score ?? 0,
                urls: data.urls || [],
                matchDetails: data.match_details,
              });
            }

            if (data.type === 'complete') {
              totalSuccess = data.total_success ?? 0;
              totalFailed = data.total_failed ?? 0;
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      return { totalSuccess, totalFailed };
    } catch (error: any) {
      console.error('Error during CV upload process:', error);
      throw new Error(error.message || 'Network error or upload failed.');
    } finally {
      if (reader) {
        try {
          reader.releaseLock();
        } catch {
          // ignore error if reader was already closed/released
        }
      }
    }
  }

  /**
   * Placeholder — detailed match analysis will be implemented with LLM scoring.
   */
  async getCVDetails(_cvId: string): Promise<MatchResult | null> {
    return null;
  }

  /**
   * Placeholder — delete functionality can be added later.
   */
  async deleteCV(_cvId: string): Promise<void> {
    // Will be implemented when needed
  }
}
