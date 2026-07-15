import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { CV } from '../../domain/entities/CV';
import { CVService } from '../../infrastructure/services/CVService';
import type { UploadProgress } from '../../application/services/ICVService';
import { JobService } from '../../infrastructure/services/JobService';
import type { Job } from '../../domain/entities/Job';
import { useAuth } from './AuthContext';

// Define context state schema
interface CVContextType {
  jobDescription: string;
  jobTitle: string;
  jobId: string;
  cvs: CV[];
  selectedCV: CV | null;
  loading: boolean;
  cvsLoading: boolean;
  error: string | null;
  uploadProgress: UploadProgress | null;
  jobsList: Job[];
  setJobDescription: (jd: string) => void;
  setJobTitle: (title: string) => void;
  setJobId: (id: string) => void;
  saveJobDetails: (id: string, title: string, description: string) => Promise<void>;
  fetchLatestJob: () => Promise<void>;
  uploadCVs: (files: File[], jobId: string, jobTitle: string) => Promise<{ totalSuccess: number; totalFailed: number } | undefined>;
  deleteCV: (cvId: string) => Promise<void>;
  setSelectedCV: (cv: CV | null) => void;
  deleteJob: (jobId: string) => Promise<void>;
  startNewJob: () => void;
  selectJob: (job: Job) => void;
  loadEvaluatedCVs: (filterJobId?: string) => Promise<void>;
  extendJobLifespan: (jobId: string, days: number) => Promise<void>;
}

const getLinkedinUrl = (urls: string[], name: string): string | undefined => {
  const linkedinUrls = urls.filter((u) => u.toLowerCase().includes('linkedin.com'));
  if (linkedinUrls.length === 0) return undefined;

  // Tokenize candidate name (split by space, strip non-alphanumeric, lower case)
  const nameParts = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((part) => part.length > 2); // only parts > 2 chars, e.g. sajith, sampath, dilhara

  // Substrings of the candidate's name (first 3 characters of each part) to match initials/short names
  const namePrefixes = nameParts.map(part => part.slice(0, 3)).filter(p => p.length >= 3);

  // Rank URLs based on match score
  let bestUrl: string | undefined = undefined;
  let maxScore = -1;

  for (const url of linkedinUrls) {
    const urlLower = url.toLowerCase();
    
    // Check if it is a personal profile URL (/in/ is standard, /posts/ or /feed/ are post links)
    const isProfile = urlLower.includes('/in/') || urlLower.includes('/pub/');
    const isPostOrShare = urlLower.includes('/posts/') || urlLower.includes('/feed/') || urlLower.includes('/share/');
    
    let score = 0;
    if (isProfile) score += 5; // Preference for profile URLs
    if (isPostOrShare) score -= 10; // Heavily demote posts/shares

    // Count name matches
    let matchesName = false;
    for (const part of nameParts) {
      if (urlLower.includes(part)) {
        score += 15;
        matchesName = true;
      }
    }

    // Count prefix matches (if not already fully matched)
    if (!matchesName) {
      for (const prefix of namePrefixes) {
        if (urlLower.includes(prefix)) {
          score += 10;
          matchesName = true;
        }
      }
    }

    // If it has absolutely no match with the candidate's name/prefixes, demote it significantly
    if (!matchesName) {
      score -= 8;
    }

    if (score > maxScore) {
      maxScore = score;
      bestUrl = url;
    }
  }

  // If the best URL scored negative (i.e. it's a post/share or has no relation to the candidate's name),
  // do not return it to prevent linking to a reference person's profile.
  if (maxScore < 0) {
    return undefined;
  }

  return bestUrl;
};

const getPortfolioUrl = (urls: string[]): string | undefined => {
  if (!urls) return undefined;
  return urls.find((u: string) => {
    const lower = u.toLowerCase();
    // Exclude social and common hosting platforms
    return !lower.includes('github.com') && 
           !lower.includes('linkedin.com') && 
           !lower.includes('gitlab.com') && 
           !lower.includes('bitbucket.org') &&
           !lower.includes('stackoverflow.com') &&
           !lower.includes('gmail.com');
  });
};

const parseDateSafely = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  if (
    typeof dateStr === 'string' &&
    !dateStr.includes('Z') &&
    !dateStr.includes('+') &&
    !/-\d{2}:\d{2}$/.test(dateStr) &&
    !/-\d{4}$/.test(dateStr)
  ) {
    if (dateStr.includes('T') || (dateStr.includes('-') && dateStr.includes(':'))) {
      return new Date(dateStr + 'Z');
    }
  }
  return new Date(dateStr);
};

const CVContext = createContext<CVContextType | undefined>(undefined);

// Instantiate our real services
const cvService = new CVService();
const jobService = new JobService();

export const CVProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [jobDescription, setJobDescriptionState] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [cvsLoading, setCvsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const autoCloseTimeoutRef = useRef<any>(null);

  // Fetch the latest job details and historical applications when user signs in
  useEffect(() => {
    if (user) {
      fetchJobsList();
      
      const savedBatchId = localStorage.getItem('active_cv_batch_id');
      const savedTotal = localStorage.getItem('active_cv_batch_total');
      const savedJobId = localStorage.getItem('active_cv_batch_job_id');
      const savedJobTitle = localStorage.getItem('active_cv_batch_job_title');
      const savedJobDesc = localStorage.getItem('active_cv_batch_job_desc');
      
      if (savedBatchId && savedTotal && savedJobId && savedJobTitle) {
        setJobId(savedJobId);
        setJobTitle(savedJobTitle);
        if (savedJobDesc) {
          setJobDescriptionState(savedJobDesc);
        }
        loadEvaluatedCVs(savedJobId);
        const total = parseInt(savedTotal, 10);
        resumeBatchMonitoring(savedBatchId, total, savedJobId, savedJobTitle);
      } else {
        startNewJob();
        loadEvaluatedCVs();
      }
    } else {
      // Clear data on logout/when not authenticated
      setJobId('');
      setJobTitle('');
      setJobDescriptionState('');
      setCvs([]);
      setSelectedCV(null);
      setJobsList([]);
    }
  }, [user]);

  const loadEvaluatedCVs = async (filterJobId?: string) => {
    setCvsLoading(true);
    try {
      const activeId = filterJobId ?? jobId;
      const url = activeId 
        ? `http://localhost:8000/api/v1/applications/?job_id=${encodeURIComponent(activeId)}` 
        : 'http://localhost:8000/api/v1/applications/';
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (response.ok) {
        const apps = await response.json();
        const mappedCVs: CV[] = apps.map((app: any) => ({
          id: app.id || app._id,
          fileName: app.file_name,
          fileSize: '',
          applicantName: app.candidate_name || 'Unknown',
          status: app.status === 'completed' ? 'completed' : (app.status === 'pending' || app.status === 'processing') ? 'processing' as any : 'failed',
          matchScore: Number(app.match_score || 0),
          uploadedAt: parseDateSafely(app.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          jobId: app.job_id,
          jobTitle: app.job_title,
          urls: app.urls || [],
          githubUrl: (app.urls || []).find((u: string) => u.toLowerCase().includes('github.com')) || undefined,
          linkedinUrl: getLinkedinUrl(app.urls || [], app.candidate_name || ''),
          portfolioUrl: getPortfolioUrl(app.urls || []),
          matchDetails: app.match_details ? {
            id: app.match_details.id || app.match_details._id || app.id || app._id,
            cvId: app.match_details.cvId || app.id || app._id,
            score: Math.round(app.match_details.score || app.match_score || 0),
            matchingSkills: app.match_details.matchingSkills || [],
            missingSkills: app.match_details.missingSkills || [],
            additionalAdvantages: app.match_details.additionalAdvantages || [],
            experienceSummary: app.match_details.experienceSummary || '',
            educationSummary: app.match_details.educationSummary || '',
            summaryReport: app.match_details.summaryReport || '',
            github_projects: app.match_details.github_projects || [],
          } : undefined
        }));
        setCvs(mappedCVs);
        // Sync selectedCV with the new data to update UI details immediately
        setSelectedCV(prev => {
          if (!prev) return null;
          const updated = mappedCVs.find(c => c.id === prev.id);
          return updated || prev;
        });
      }
    } catch (err) {
      console.error('Error loading evaluated CVs:', err);
    } finally {
      setCvsLoading(false);
    }
  };

  const setJobDescription = (jd: string) => {
    setJobDescriptionState(jd);
  };

  /**
   * Fetches all jobs and saves to jobsList state.
   */
  const fetchJobsList = async (): Promise<Job[]> => {
    try {
      const jobs = await jobService.listJobs();
      const sorted = jobs.sort((a, b) => {
        const dateA = a.updatedAt ? parseDateSafely(a.updatedAt).getTime() : (a.createdAt ? parseDateSafely(a.createdAt).getTime() : 0);
        const dateB = b.updatedAt ? parseDateSafely(b.updatedAt).getTime() : (b.createdAt ? parseDateSafely(b.createdAt).getTime() : 0);
        return dateB - dateA;
      });
      setJobsList(sorted);
      return sorted;
    } catch (err) {
      console.error('Error fetching jobs list:', err);
      return [];
    }
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
      await fetchJobsList();
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
      const sortedJobs = await fetchJobsList();
      if (sortedJobs.length > 0) {
        const latest = sortedJobs[0];
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

  const startNewJob = () => {
    setJobId('');
    setJobTitle('');
    setJobDescriptionState('');
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
    localStorage.removeItem('active_cv_batch_id');
    localStorage.removeItem('active_cv_batch_total');
    localStorage.removeItem('active_cv_batch_job_id');
    localStorage.removeItem('active_cv_batch_job_title');
    localStorage.removeItem('active_cv_batch_job_desc');
    setUploadProgress(null);
  };

  const selectJob = async (job: Job) => {
    setJobId(job.jobId);
    setJobTitle(job.title);
    setJobDescriptionState(job.description);
    loadEvaluatedCVs(job.jobId);
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
    setUploadProgress(null);

    try {
      const activeBatch = await cvService.checkActiveBatch(job.jobId);
      if (activeBatch && activeBatch.active && activeBatch.batchId && activeBatch.totalFiles) {
        localStorage.setItem('active_cv_batch_id', activeBatch.batchId);
        localStorage.setItem('active_cv_batch_total', activeBatch.totalFiles.toString());
        localStorage.setItem('active_cv_batch_job_id', job.jobId);
        localStorage.setItem('active_cv_batch_job_title', job.title);
        localStorage.setItem('active_cv_batch_job_desc', job.description);

        resumeBatchMonitoring(activeBatch.batchId, activeBatch.totalFiles, job.jobId, job.title);
      } else {
        localStorage.removeItem('active_cv_batch_id');
        localStorage.removeItem('active_cv_batch_total');
        localStorage.removeItem('active_cv_batch_job_id');
        localStorage.removeItem('active_cv_batch_job_title');
        localStorage.removeItem('active_cv_batch_job_desc');
      }
    } catch (err) {
      console.warn('Failed to check active batch on selectJob:', err);
      localStorage.removeItem('active_cv_batch_id');
      localStorage.removeItem('active_cv_batch_total');
      localStorage.removeItem('active_cv_batch_job_id');
      localStorage.removeItem('active_cv_batch_job_title');
      localStorage.removeItem('active_cv_batch_job_desc');
    }
  };

  const deleteJob = async (idToDelete: string) => {
    setLoading(true);
    setError(null);
    try {
      await jobService.deleteJob(idToDelete);
      setJobsList((prev) => prev.filter((j) => j.jobId !== idToDelete));
      if (jobId === idToDelete) {
        startNewJob();
      }
      await loadEvaluatedCVs();
    } catch (err: any) {
      setError(err.message || 'Failed to delete job.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Uploads CVs via the real backend service with SSE progress tracking.
   */
  const uploadCVs = async (files: File[], uploadJobId: string, uploadJobTitle: string): Promise<{ totalSuccess: number; totalFailed: number } | undefined> => {
    if (files.length === 0) {
      setError('No files selected. Please select one or more PDF, DOCX or TXT files.');
      return;
    }

    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
    setLoading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const result = await cvService.uploadCVs(files, uploadJobId, uploadJobTitle, (progress) => {
        setUploadProgress(progress);
        if (progress.batchId) {
          localStorage.setItem('active_cv_batch_id', progress.batchId);
          localStorage.setItem('active_cv_batch_total', progress.total.toString());
          localStorage.setItem('active_cv_batch_job_id', uploadJobId);
          localStorage.setItem('active_cv_batch_job_title', uploadJobTitle);
          localStorage.setItem('active_cv_batch_job_desc', jobDescription);
        }

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
            urls: progress.urls || [],
            githubUrl: (progress.urls || []).find((u: string) => u.toLowerCase().includes('github.com')) || undefined,
            linkedinUrl: getLinkedinUrl(progress.urls || [], progress.candidateName || progress.fileName.replace(/\.[^/.]+$/, '')),
            portfolioUrl: getPortfolioUrl(progress.urls || []),
            matchDetails: progress.matchDetails ? {
              id: progress.matchDetails.id || progress.matchDetails._id || progress.applicationId || '',
              cvId: progress.matchDetails.cvId || progress.applicationId || '',
              score: Math.round(progress.matchDetails.score || progress.matchScore || 0),
              matchingSkills: progress.matchDetails.matchingSkills || [],
              missingSkills: progress.matchDetails.missingSkills || [],
              additionalAdvantages: progress.matchDetails.additionalAdvantages || [],
              experienceSummary: progress.matchDetails.experienceSummary || '',
              educationSummary: progress.matchDetails.educationSummary || '',
              summaryReport: progress.matchDetails.summaryReport || '',
              github_projects: progress.matchDetails.github_projects || [],
            } : undefined
          };
          setCvs((prevCVs) => [newCV, ...prevCVs]);
        }
      });

      // Reload evaluated CVs to pull full match_details/github_projects from DB
      await loadEvaluatedCVs();

      if (result.totalFailed > 0) {
        setError(`${result.totalFailed} file(s) failed to process.`);
      }
      return result;
    } catch (err: any) {
      setError(err.message || 'Error processing files. Please try again.');
      throw err;
    } finally {
      setLoading(false);
      localStorage.removeItem('active_cv_batch_id');
      localStorage.removeItem('active_cv_batch_total');
      localStorage.removeItem('active_cv_batch_job_id');
      localStorage.removeItem('active_cv_batch_job_title');
      localStorage.removeItem('active_cv_batch_job_desc');
      autoCloseTimeoutRef.current = setTimeout(() => {
        setUploadProgress(null);
        autoCloseTimeoutRef.current = null;
      }, 3000);
    }
  };

  /**
   * Resumes monitoring of an active background batch processing job on reconnect/reload.
   */
  const resumeBatchMonitoring = async (batchId: string, total: number, savedJobId: string, savedJobTitle: string) => {
    setLoading(true);
    setError(null);
    setUploadProgress({
      current: 0,
      total: total,
      fileName: '',
      status: 'uploaded',
      currentStage: 'Reconnecting to background task...',
      batchId: batchId
    });

    try {
      const result = await cvService.pollBatchStatus(batchId, total, (progress) => {
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
            jobId: savedJobId,
            jobTitle: savedJobTitle,
            urls: progress.urls || [],
            githubUrl: (progress.urls || []).find((u: string) => u.toLowerCase().includes('github.com')) || undefined,
            linkedinUrl: getLinkedinUrl(progress.urls || [], progress.candidateName || progress.fileName.replace(/\.[^/.]+$/, '')),
            portfolioUrl: getPortfolioUrl(progress.urls || []),
            matchDetails: progress.matchDetails ? {
              id: progress.matchDetails.id || progress.matchDetails._id || progress.applicationId || '',
              cvId: progress.matchDetails.cvId || progress.applicationId || '',
              score: Math.round(progress.matchDetails.score || progress.matchScore || 0),
              matchingSkills: progress.matchDetails.matchingSkills || [],
              missingSkills: progress.matchDetails.missingSkills || [],
              additionalAdvantages: progress.matchDetails.additionalAdvantages || [],
              experienceSummary: progress.matchDetails.experienceSummary || '',
              educationSummary: progress.matchDetails.educationSummary || '',
              summaryReport: progress.matchDetails.summaryReport || '',
              github_projects: progress.matchDetails.github_projects || [],
            } : undefined
          };
          setCvs((prevCVs) => {
            // Check if this CV is already in the list to avoid duplicate rendering on reconnect
            if (prevCVs.some(c => c.id === newCV.id)) return prevCVs;
            return [newCV, ...prevCVs];
          });
        }
      });

      // Reload evaluated CVs to pull full match_details/github_projects from DB
      await loadEvaluatedCVs(savedJobId);

      if (result.totalFailed > 0) {
        setError(`${result.totalFailed} file(s) failed to process.`);
      }
    } catch (err: any) {
      setError(err.message || 'Error monitoring progress.');
    } finally {
      setLoading(false);
      localStorage.removeItem('active_cv_batch_id');
      localStorage.removeItem('active_cv_batch_total');
      localStorage.removeItem('active_cv_batch_job_id');
      localStorage.removeItem('active_cv_batch_job_title');
      localStorage.removeItem('active_cv_batch_job_desc');
      autoCloseTimeoutRef.current = setTimeout(() => {
        setUploadProgress(null);
        autoCloseTimeoutRef.current = null;
      }, 3000);
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

  /**
   * Extends the lifespan of a specific job by a number of days.
   */
  const extendJobLifespan = async (jobId: string, days: number) => {
    setLoading(true);
    setError(null);
    try {
      const updatedJob = await jobService.extendJob(jobId, days);
      setJobsList((prevJobs) =>
        prevJobs.map((j) => (j.jobId === jobId ? updatedJob : j))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to extend job lifespan.');
    } finally {
      setLoading(false);
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
        cvsLoading,
        error,
        uploadProgress,
        jobsList,
        setJobDescription,
        setJobTitle,
        setJobId,
        saveJobDetails,
        fetchLatestJob,
        uploadCVs,
        deleteCV,
        setSelectedCV,
        deleteJob,
        startNewJob,
        selectJob,
        loadEvaluatedCVs,
        extendJobLifespan,
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
