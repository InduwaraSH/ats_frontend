import type { MatchResult } from '../../domain/entities/MatchResult';

/**
 * Progress callback payload from SSE stream.
 */
export interface UploadProgress {
  current: number;
  total: number;
  fileName: string;
  status: 'completed' | 'failed' | 'uploading' | 'uploaded';
  error?: string;
  candidateId?: string;
  applicationId?: string;
  candidateName?: string;
  matchScore?: number;
  urls?: string[];
  matchDetails?: any;
  currentStage?: string;
  batchId?: string;
}

/**
 * CV analysis and processing service interface.
 * Defines the contract for parsing CVs against job descriptions.
 */
export interface ICVService {
  /**
   * Uploads CV files to the backend for processing.
   * @param files Array of uploaded files (PDF, TXT, DOCX etc.)
   * @param jobId Unique Job ID to match CVs against
   * @param jobTitle Job Title to match CVs against
   * @param onProgress Callback fired for each file's progress event
   * @returns Summary of the upload operation
   */
  uploadCVs(
    files: File[],
    jobId: string,
    jobTitle: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<{ totalSuccess: number; totalFailed: number }>;

  /**
   * Polls the status of an existing batch upload by its ID.
   */
  pollBatchStatus(
    batchId: string,
    totalFiles: number,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<{ totalSuccess: number; totalFailed: number }>;

  /**
   * Retrieves the detailed match analysis report for a specific CV.
   * @param cvId Unique identifier of the CV
   */
  getCVDetails(cvId: string): Promise<MatchResult | null>;

  /**
   * Removes a CV from the evaluated candidate list.
   * @param cvId Unique identifier of the CV
   */
  deleteCV(cvId: string): Promise<void>;

  /**
   * Checks if there is an active batch processing job for a specific job.
   */
  checkActiveBatch(jobId: string): Promise<{ active: boolean; batchId?: string; totalFiles?: number } | null>;
}

