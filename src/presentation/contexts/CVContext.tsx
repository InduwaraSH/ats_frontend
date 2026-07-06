import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CV } from '../../domain/entities/CV';
import { CVService } from '../../infrastructure/services/CVService';
import type { UploadProgress } from '../../application/services/ICVService';
import { JobService } from '../../infrastructure/services/JobService';

// Define context state schema
interface CVContextType {
  jobDescription: string;
  jobTitle: string;
  jobId: string;
  cvs: CV[];
  selectedCV: CV | null;
  loading: boolean;
  error: string | null;
  uploadProgress: UploadProgress | null;
  setJobDescription: (jd: string) => void;
  setJobTitle: (title: string) => void;
  setJobId: (id: string) => void;
  saveJobDetails: (id: string, title: string, description: string) => Promise<void>;
  fetchLatestJob: () => Promise<void>;
  uploadCVs: (files: File[], jobId: string, jobTitle: string) => Promise<void>;
  deleteCV: (cvId: string) => Promise<void>;
  setSelectedCV: (cv: CV | null) => void;
}

const CVContext = createContext<CVContextType | undefined>(undefined);

// Instantiate our real services
const cvService = new CVService();
const jobService = new JobService();

export const CVProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobDescription, setJobDescriptionState] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // Fetch the latest job details and historical applications on mount
  useEffect(() => {
    fetchLatestJob();
    loadEvaluatedCVs();
  }, []);

  const loadEvaluatedCVs = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/applications/', {
        credentials: 'include',
      });
      if (response.ok) {
        const apps = await response.json();
        const mappedCVs: CV[] = apps.map((app: any) => ({
          id: app.id || app._id,
          fileName: app.file_name,
          fileSize: '',
          applicantName: app.candidate_name || 'Unknown',
          status: app.status === 'completed' ? 'completed' : 'failed',
          matchScore: Math.round(app.match_score || 0),
          uploadedAt: new Date(app.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          jobId: app.job_id,
          jobTitle: app.job_title,
        }));
        setCvs(mappedCVs);
      }
    } catch (err) {
      console.error('Error loading evaluated CVs:', err);
    }
  };

  const setJobDescription = (jd: string) => {
    setJobDescriptionState(jd);
  };

  /**
   * Saves or updates job details in the backend.
   */
  const saveJobDetails = async (id: string, title: string, description: string) => {
    setLoading(true);
    setError(null);
    try {
      const saved = await jobService.saveJob({
        jobId: id,
        title,
        description,
      });
      setJobId(saved.jobId);
      setJobTitle(saved.title);
      setJobDescriptionState(saved.description);
    } catch (err: any) {
      setError(err.message || 'Failed to save job details.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches latest job details and populates context state.
   */
  const fetchLatestJob = async () => {
    setLoading(true);
    setError(null);
    try {
      const jobs = await jobService.listJobs();
      if (jobs.length > 0) {
        // Sort descending by updatedAt
        const sorted = jobs.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        });
        const latest = sorted[0];
        setJobId(latest.jobId);
        setJobTitle(latest.title);
        setJobDescriptionState(latest.description);
      }
    } catch (err: any) {
      console.error('Error fetching latest job:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Uploads CVs via the real backend service with SSE progress tracking.
   */
  const uploadCVs = async (files: File[], uploadJobId: string, uploadJobTitle: string) => {
    if (files.length === 0) {
      setError('No files selected. Please select one or more PDF, DOCX or TXT files.');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const result = await cvService.uploadCVs(files, uploadJobId, uploadJobTitle, (progress) => {
        setUploadProgress(progress);

        // Build a CV entity for each completed file and add to the list
        if (progress.status === 'completed') {
          const newCV: CV = {
            id: progress.applicationId ?? `cv_${Date.now()}_${progress.current}`,
            fileName: progress.fileName,
            fileSize: '',
            applicantName:
              progress.candidateName ??
              progress.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
            status: 'completed',
            matchScore: progress.matchScore ?? 0,
            uploadedAt: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            jobId: uploadJobId,
            jobTitle: uploadJobTitle,
          };
          setCvs((prevCVs) => [newCV, ...prevCVs]);
        }
      });

      if (result.totalFailed > 0) {
        setError(`${result.totalFailed} file(s) failed to process.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error processing files. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  /**
   * Removes a CV from the candidate grid.
   */
  const deleteCV = async (cvId: string) => {
    try {
      await cvService.deleteCV(cvId);
      setCvs((prevCVs) => prevCVs.filter((cv) => cv.id !== cvId));
      if (selectedCV?.id === cvId) {
        setSelectedCV(null);
      }
    } catch (err) {
      console.error('Delete CV failed:', err);
    }
  };

  return (
    <CVContext.Provider
      value={{
        jobDescription,
        jobTitle,
        jobId,
        cvs,
        selectedCV,
        loading,
        error,
        uploadProgress,
        setJobDescription,
        setJobTitle,
        setJobId,
        saveJobDetails,
        fetchLatestJob,
        uploadCVs,
        deleteCV,
        setSelectedCV,
      }}
    >
      {children}
    </CVContext.Provider>
  );
};

// Custom hook to consume the CV analysis context
export const useCV = () => {
  const context = useContext(CVContext);
  if (!context) {
    throw new Error('useCV must be consumed within a CVProvider');
  }
  return context;
};
