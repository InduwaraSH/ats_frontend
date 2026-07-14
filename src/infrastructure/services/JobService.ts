import type { IJobService } from '../../application/services/IJobService';
import type { Job } from '../../domain/entities/Job';

/**
 * Real implementation of IJobService connecting to FastAPI backend job endpoint.
 */
export class JobService implements IJobService {
  private API_BASE_URL = 'http://localhost:8000/api/v1';

  async saveJob(job: Job): Promise<Job> {
    const response = await fetch(`${this.API_BASE_URL}/job/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_id: job.jobId,
        title: job.title,
        description: job.description,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = 'Failed to save job details';
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

    const savedData = await response.json();
    return {
      id: savedData.id,
      jobId: savedData.job_id,
      title: savedData.title,
      description: savedData.description,
      createdAt: savedData.created_at,
      updatedAt: savedData.updated_at,
      createdWay: savedData.created_way,
      daysRemaining: savedData.days_remaining,
    };
  }

  async getJob(jobId: string): Promise<Job> {
    const response = await fetch(`${this.API_BASE_URL}/job/${jobId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `Failed to fetch job with ID ${jobId}`;
      try {
        const errData = await response.json();
        if (errData?.detail) {
          errorMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
        }
      } catch {
        // use default
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      id: data.id,
      jobId: data.job_id,
      title: data.title,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdWay: data.created_way,
      daysRemaining: data.days_remaining,
    };
  }

  async listJobs(): Promise<Job[]> {
    const response = await fetch(`${this.API_BASE_URL}/job/`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = 'Failed to list jobs';
      try {
        const errData = await response.json();
        if (errData?.detail) {
          errorMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
        }
      } catch {
        // use default
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id,
      jobId: item.job_id,
      title: item.title,
      description: item.description,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      createdWay: item.created_way,
      daysRemaining: item.days_remaining,
    }));
  }

  async deleteJob(jobId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/job/${jobId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `Failed to delete job with ID ${jobId}`;
      try {
        const errData = await response.json();
        if (errData?.detail) {
          errorMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
        }
      } catch {
        // use default
      }
      throw new Error(errorMessage);
    }
  }

  async extendJob(jobId: string, days: number): Promise<Job> {
    const response = await fetch(`${this.API_BASE_URL}/job/${encodeURIComponent(jobId)}/extend?days=${days}`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMessage = `Failed to extend job with ID ${jobId}`;
      try {
        const errData = await response.json();
        if (errData?.detail) {
          errorMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
        }
      } catch {
        // use default
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      id: data.id,
      jobId: data.job_id,
      title: data.title,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdWay: data.created_way,
      daysRemaining: data.days_remaining,
      expiresAt: data.expires_at,
    };
  }
}
export const jobServiceInstance = new JobService();
