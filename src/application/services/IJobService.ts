import type { Job } from '../../domain/entities/Job';

/**
 * Service contract for managing job specifications.
 */
export interface IJobService {
  /**
   * Saves or updates job details in the database.
   */
  saveJob(job: Job): Promise<Job>;

  /**
   * Retrieves a specific job by its user-defined ID.
   */
  getJob(jobId: string): Promise<Job>;

  /**
   * Lists all jobs saved in the system.
   */
  listJobs(): Promise<Job[]>;
}
