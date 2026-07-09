import type { MatchResult } from './MatchResult';

/**
 * Domain entity representing an uploaded CV (Resume) in the ATS system.
 */
export interface CV {
  id: string;
  fileName: string;
  fileSize: string;
  applicantName: string;
  status: 'parsing' | 'completed' | 'failed';
  matchScore: number; // 0 to 100
  matchDetails?: MatchResult;
  uploadedAt: string;
  jobId?: string;
  jobTitle?: string;
  urls?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
}
