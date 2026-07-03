import type { CV } from '../../domain/entities/CV';
import type { MatchResult } from '../../domain/entities/MatchResult';

/**
 * CV analysis and processing service interface.
 * Defines the contract for parsing CVs against job descriptions.
 */
export interface ICVService {
  /**
   * Processes a list of uploaded files and scores them against the job description.
   * @param jobDescription The target job description text
   * @param files Array of uploaded files (PDF, TXT, DOCX etc.)
   * @returns Array of CV entities containing basic score and metadata
   */
  analyzeCVs(jobDescription: string, files: File[]): Promise<CV[]>;

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
