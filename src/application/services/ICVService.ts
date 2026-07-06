import type { MatchResult } from '../../domain/entities/MatchResult';

/**
 * Progress callback payload from SSE stream.
 */
export interface UploadProgress {
  current: number;
  total: number;
  fileName: string;
  status: 'completed' | 'failed';
  error?: string;
  candidateId?: string;
  applicationId?: string;
  candidateName?: string;
}

/**
 * CV analysis and processing service interface.
 * Defines the contract for parsing CVs against job descriptions.
 */
export interface ICVService {
  /**
   * Uploads CV files to the backend for processing.
   * @param files Array of uploaded files (PDF, TXT, DOCX etc.)
   * @param onProgress Callback fired for each file's progress event
   * @returns Summary of the upload operation
   */
  uploadCVs(
    files: File[],
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
}
