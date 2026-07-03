import type { ICVService } from '../../application/services/ICVService';
import type { CV } from '../../domain/entities/CV';
import type { MatchResult } from '../../domain/entities/MatchResult';

/**
 * Mock implementation of ICVService.
 * Simulates resume parsing and score calculation against a job description.
 */
export class MockCVService implements ICVService {
  // Collection of simulated candidate names when filename is generic
  private MOCK_NAMES = [
    'Roshan Silva',
    'Dilani Wijesinghe',
    'Kasun Jayawardena',
    'Kamal Perera',
    'Priyantha Bandara',
    'Nishadi Fernando',
    'Aruni Rathnayake',
    'Ruwan Gamage',
    'Sanduni De Silva',
    'Thilina Rathnayake'
  ];

  // List of candidate database stores in memory
  private cvStore: Map<string, CV> = new Map();
  private resultStore: Map<string, MatchResult> = new Map();

  /**
   * Helper to clean up filenames and extract a readable candidate name.
   */
  private extractNameFromFileName(fileName: string, index: number): string {
    // Remove extension
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    // Check if filename is generic (e.g., resume, cv, draft)
    const genericTerms = ['resume', 'cv', 'mycv', 'job', 'application', 'doc', 'pdf', 'profile'];
    const isGeneric = genericTerms.some(term => baseName.toLowerCase().replace(/[^a-z]/g, '') === term);
    
    if (isGeneric) {
      // Pick from mock list based on file index
      return this.MOCK_NAMES[index % this.MOCK_NAMES.length];
    }

    // Format filename: replace symbols with spaces and capitalize
    return baseName
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Helper to get a human-readable file size string.
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Evaluates files against a job description, simulating processing delay.
   */
  async analyzeCVs(jobDescription: string, files: File[]): Promise<CV[]> {
    // Simulate server upload and parsing delay (1500ms)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Define standard technical keywords to search/match in JD
    const techKeywords = [
      'react', 'typescript', 'javascript', 'python', 'django', 'flask', 'css', 'html',
      'node', 'express', 'sql', 'postgresql', 'mongodb', 'git', 'docker', 'aws',
      'kubernetes', 'ci/cd', 'graphql', 'rest api', 'clean architecture', 'security',
      'testing', 'agile', 'scrum', 'next.js', 'vue', 'angular', 'tailwind'
    ];

    // Detect keywords present in the user's Job Description
    const jdLower = jobDescription.toLowerCase();
    const jdKeywords = techKeywords.filter(keyword => jdLower.includes(keyword));
    
    // If Job Description is very brief, default to a fallback set
    const activeKeywords = jdKeywords.length > 0 
      ? jdKeywords 
      : ['javascript', 'react', 'git', 'css', 'rest api', 'clean architecture'];

    const newCVs: CV[] = [];

    files.forEach((file, index) => {
      const cvId = 'cv_' + Math.random().toString(36).substr(2, 9);
      const applicantName = this.extractNameFromFileName(file.name, index);
      const fileSizeString = this.formatBytes(file.size);
      
      // Calculate a deterministic score based on the candidate's name & JD matching keywords
      // We seed it to simulate varying qualifications
      const nameSeed = applicantName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const scoreModifier = (nameSeed % 40) - 15; // -15 to +25 score variation
      const baseScore = 70;
      const finalScore = Math.min(Math.max(baseScore + scoreModifier, 45), 98); // Lock score between 45% and 98%

      // Determine matching and missing skills based on the score
      const matchingCount = Math.round((finalScore / 100) * activeKeywords.length);
      const shuffledKeywords = [...activeKeywords].sort(() => 0.5 - Math.random());
      
      const matchingSkills = shuffledKeywords.slice(0, matchingCount);
      const missingSkills = shuffledKeywords.slice(matchingCount);
      
      // Select 2-3 additional advantages not explicitly listed in JD
      const potentialAdvantages = [
        'Cloud Architectures (AWS/GCP)', 
        'Microservices Design', 
        'Unit & Integration Testing (Jest/PyTest)', 
        'CI/CD Pipeline Setup (GitHub Actions)', 
        'GraphQL Integration', 
        'Docker Containerization',
        'Redis Caching',
        'TypeScript Strict Typing Configuration'
      ];
      const additionalAdvantages = potentialAdvantages
        .filter(adv => !activeKeywords.some(key => adv.toLowerCase().includes(key)))
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 2);

      // Generate a dynamic prose evaluation report
      const matchingList = matchingSkills.join(', ');
      const missingList = missingSkills.length > 0 ? missingSkills.join(', ') : 'none';
      const advList = additionalAdvantages.join(', ');

      const summaryReport = `The applicant, ${applicantName}, displays a matching score of ${finalScore}% based on their credentials. 

Strengths: They demonstrate solid proficiency in key technologies required for this role, specifically in ${matchingList || 'foundational core concepts'}.

Areas for Growth: There is a lack of clear coverage regarding ${missingList}. Integrating these skills will boost efficiency.

Bonus Assets: Additionally, ${applicantName} possesses skills in ${advList}, which represent immediate extra value for our engineering team. We recommend moving them to the next technical screening round.`;

      const matchDetails: MatchResult = {
        id: 'mr_' + Math.random().toString(36).substr(2, 9),
        cvId,
        score: finalScore,
        matchingSkills,
        missingSkills,
        additionalAdvantages,
        experienceSummary: `${3 + (nameSeed % 6)} years of industry experience working in software development.`,
        educationSummary: `B.Sc. in Computer Science or equivalent certification from ${nameSeed % 2 === 0 ? 'a State University' : 'a recognized IT Institute'}.`,
        summaryReport
      };

      const cvEntity: CV = {
        id: cvId,
        fileName: file.name,
        fileSize: fileSizeString,
        applicantName,
        status: 'completed',
        matchScore: finalScore,
        matchDetails,
        uploadedAt: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      // Store in memory mock database
      this.cvStore.set(cvId, cvEntity);
      this.resultStore.set(cvId, matchDetails);
      newCVs.push(cvEntity);
    });

    return newCVs;
  }

  /**
   * Fetches full analysis dashboard records.
   */
  async getCVDetails(cvId: string): Promise<MatchResult | null> {
    // Artificial load latency
    await new Promise((resolve) => setTimeout(resolve, 300));
    return this.resultStore.get(cvId) || null;
  }

  /**
   * Deletes a CV.
   */
  async deleteCV(cvId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.cvStore.delete(cvId);
    this.resultStore.delete(cvId);
  }
}
