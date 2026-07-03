import React, { createContext, useContext, useState } from 'react';
import type { CV } from '../../domain/entities/CV';
import { MockCVService } from '../../infrastructure/services/MockCVService';

// Define context state schema
interface CVContextType {
  jobDescription: string;
  cvs: CV[];
  selectedCV: CV | null;
  loading: boolean;
  error: string | null;
  setJobDescription: (jd: string) => void;
  uploadCVs: (files: File[]) => Promise<void>;
  deleteCV: (cvId: string) => Promise<void>;
  setSelectedCV: (cv: CV | null) => void;
}

const CVContext = createContext<CVContextType | undefined>(undefined);

// Instantiate our mock CV service
const cvService = new MockCVService();

export const CVProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobDescription, setJobDescriptionState] = useState<string>('');
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const setJobDescription = (jd: string) => {
    setJobDescriptionState(jd);
  };

  /**
   * Uploads and scores the CVs using the CVService.
   */
  const uploadCVs = async (files: File[]) => {
    if (!jobDescription.trim()) {
      setError('Please provide a Job Description before uploading resumes.');
      return;
    }
    
    if (files.length === 0) {
      setError('No files selected. Please select one or more PDF or Text files.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedCVs = await cvService.analyzeCVs(jobDescription, files);
      setCvs((prevCVs) => [...parsedCVs, ...prevCVs]);
    } catch (err: any) {
      setError(err.message || 'Error processing files. Please try again.');
    } finally {
      setLoading(false);
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
