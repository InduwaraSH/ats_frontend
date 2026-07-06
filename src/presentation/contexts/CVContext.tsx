import React, { createContext, useContext, useState } from 'react';
import type { CV } from '../../domain/entities/CV';
import { CVService } from '../../infrastructure/services/CVService';
import type { UploadProgress } from '../../application/services/ICVService';

// Define context state schema
interface CVContextType {
  jobDescription: string;
  cvs: CV[];
  selectedCV: CV | null;
  loading: boolean;
  error: string | null;
  uploadProgress: UploadProgress | null;
  setJobDescription: (jd: string) => void;
  uploadCVs: (files: File[]) => Promise<void>;
  deleteCV: (cvId: string) => Promise<void>;
  setSelectedCV: (cv: CV | null) => void;
}

const CVContext = createContext<CVContextType | undefined>(undefined);

// Instantiate our real CV service
const cvService = new CVService();

export const CVProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobDescription, setJobDescriptionState] = useState<string>('');
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const setJobDescription = (jd: string) => {
    setJobDescriptionState(jd);
  };

  /**
   * Uploads CVs via the real backend service with SSE progress tracking.
   */
  const uploadCVs = async (files: File[]) => {
    if (files.length === 0) {
      setError('No files selected. Please select one or more PDF, DOCX or TXT files.');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress(null);

    try {
      const result = await cvService.uploadCVs(files, (progress) => {
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
            matchScore: 0, // Will be set by LLM scoring later
            uploadedAt: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
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
        cvs,
        selectedCV,
        loading,
        error,
        uploadProgress,
        setJobDescription,
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
