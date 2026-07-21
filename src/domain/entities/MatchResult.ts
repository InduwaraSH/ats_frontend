/**
 * Domain entity representing the detailed compatibility analysis of a CV against a Job Description.
 */
export interface MatchResult {
  id: string;
  cvId: string;
  score: number; // 0 to 100
  matchingSkills: string[]; // Skills/Keywords that match the JD
  missingSkills: string[]; // Skills/Keywords in the JD but missing in the CV
  additionalAdvantages: string[]; // Valuable skills/technologies found in the CV but not specifically requested in the JD
  experienceSummary: string; // Summary of candidate's relevant experience
  educationSummary: string; // Summary of candidate's education and credentials
  summaryReport: string; // Dynamic narrative summarizing the candidate's strengths and suitability
  recommendation?: string;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  categoryScores?: {
    skills_match?: number;
    experience_match?: number;
    education_match?: number;
    culture_fit?: number;
    github_activity?: number;
  };
  github_projects?: {
    name: string;
    html_url: string;
    description: string;
    languages: string[];
    topics: string[];
    stars: number;
    forks: number;
    matching_skills: string[];
    is_aligned: boolean;
    is_fork?: boolean;
  }[];
}
