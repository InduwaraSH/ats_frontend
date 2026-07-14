/**
 * Domain entity representing a Job specification in the ATS system.
 */
export interface Job {
  id?: string;
  jobId: string;
  title: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  createdWay?: string;
  daysRemaining?: number;
  expiresAt?: string;
}
