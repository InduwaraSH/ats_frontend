import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCV } from '../contexts/CVContext';

import {
  LogOut,
  Briefcase,
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  User,
  Clock,
  ChevronRight,
  Info,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    jobDescription,
    cvs,
    selectedCV,
    loading,
    error,
    setJobDescription,
    uploadCVs,
    deleteCV,
    setSelectedCV,
  } = useCV();

  const [jdText, setJdText] = useState(jobDescription);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize internal text state with global context
  const handleJdChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJdText(e.target.value);
    setJobDescription(e.target.value);
    if (uploadError) setUploadError(null);
  };

  // Drag and Drop File Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError(null);

    if (!jdText.trim()) {
      setUploadError('Please paste a Job Description before uploading CVs.');
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(file => 
        file.type === 'application/pdf' || 
        file.type === 'text/plain' ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.docx')
      );

      if (validFiles.length === 0) {
        setUploadError('Unsupported files. Please upload PDF, TXT or DOCX resumes.');
        return;
      }

      await uploadCVs(validFiles);
    }
  };

  // File Select Input Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!jdText.trim()) {
      setUploadError('Please paste a Job Description before uploading CVs.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await uploadCVs(files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Helpers to color scores dynamically
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'var(--accent-emerald)';
    if (score >= 60) return 'var(--accent-amber)';
    return 'var(--accent-rose)';
  };

  const getScoreBgGlow = (score: number) => {
    if (score >= 75) return 'var(--accent-emerald-glow)';
    if (score >= 60) return 'var(--accent-amber-glow)';
    return 'var(--accent-rose-glow)';
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Top Navigation Bar */}
      <header style={styles.header} className="glass-panel">
        <div style={styles.headerLogo}>
          <div style={styles.logoBadge}>
            <Sparkles size={20} color="var(--accent-indigo)" />
          </div>
          <span style={styles.logoText}>ATS Candidate Matcher</span>
        </div>

        <div style={styles.userInfoArea}>
          <div style={styles.userBadge}>
            <User size={14} color="var(--text-muted)" />
            <span style={styles.userEmail}>{user?.email}</span>
          </div>
          <button onClick={logout} className="btn-secondary" style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Grid Area */}
      <main style={styles.mainContent} className="container">
        <div style={styles.gridColumns}>
          
          {/* Left Column: Evaluation Setup */}
          <section style={styles.leftCol}>
            <div className="glass-card" style={styles.panelCard}>
              <div style={styles.panelHeader}>
                <Briefcase size={18} color="var(--accent-indigo)" />
                <h3 style={styles.panelTitle}>Job Description</h3>
              </div>
              <p style={styles.panelDesc}>
                Paste the targets, responsibilities, or keywords you expect from applicants.
              </p>
              
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <textarea
                  className="form-control"
                  style={styles.jdTextarea}
                  placeholder="Paste job details here... e.g. We are looking for a Senior React Developer with 3+ years experience in TypeScript, Tailwind CSS, State Management and Git..."
                  value={jdText}
                  onChange={handleJdChange}
                  rows={8}
                />
                <div style={styles.jdMeta}>
                  <span>{jdText.length} characters</span>
                  <span>{jdText.split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>

              <div style={styles.panelHeader}>
                <UploadCloud size={18} color="var(--accent-indigo)" />
                <h3 style={styles.panelTitle}>Upload Resumes</h3>
              </div>
              <p style={styles.panelDesc}>
                Drag & drop candidate CVs (PDF, TXT, DOCX) to rank their compatibility.
              </p>

              {/* Upload Drop Zone */}
              <div
                style={{
                  ...styles.dropZone,
                  borderColor: dragActive ? 'var(--accent-indigo)' : 'var(--border-glass)',
                  backgroundColor: dragActive ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                  boxShadow: dragActive ? 'var(--shadow-glow)' : 'none',
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <input
                  id="cv-file-input"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ opacity: 0, position: 'absolute', width: '1px', height: '1px', pointerEvents: 'none' }}
                  accept=".pdf,.txt,.docx,application/pdf,text/plain"
                />
                <div style={styles.dropZoneContent}>
                  <div style={styles.uploadIconCircle}>
                    <UploadCloud size={28} color="var(--accent-indigo)" />
                  </div>
                  <p style={styles.dropTextMain}>Drag CV files here or click to browse</p>
                  <p style={styles.dropTextSub}>Supports PDF, Text, and Word files up to 5MB</p>
                </div>
              </div>

              {/* Quick Mock Test Resumes */}
              <div style={styles.quickUploadArea}>
                <span style={styles.quickUploadText}>Want to test the platform instantly?</span>
                <button
                  id="btn-mock-upload"
                  type="button"
                  style={styles.quickUploadBtn}
                  onClick={async (e) => {
                    e.stopPropagation(); // Avoid triggering file selection dialog
                    const mockFile1 = new File(["Kamal Perera\nSenior Software Engineer\nPython Django REST API Git Docker Clean Architecture"], "Kamal_Perera_Resume.pdf", { type: "application/pdf" });
                    const mockFile2 = new File(["Roshan Silva\nSenior Frontend Developer\nReact TypeScript HTML CSS Git"], "Roshan_Silva_CV.txt", { type: "text/plain" });
                    await uploadCVs([mockFile1, mockFile2]);
                  }}
                  disabled={loading || !jdText.trim()}
                  title={!jdText.trim() ? "Please enter a Job Description first" : "Click to load sample candidates"}
                >
                  Load Sample Resumes
                </button>
              </div>

              {/* Error messages */}
              {(uploadError || error) && (
                <div style={styles.errorText}>
                  <Info size={16} />
                  <span>{uploadError || error}</span>
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Evaluation Grid Results */}
          <section style={styles.rightCol}>
            <div style={styles.resultsHeader}>
              <h3 style={styles.resultsTitle}>
                Evaluated Candidates
                <span style={styles.countBadge}>{cvs.length}</span>
              </h3>
            </div>

            {/* Empty State */}
            {cvs.length === 0 && (
              <div className="glass-card animate-fade-in" style={styles.emptyState}>
                <FileSpreadsheet size={48} color="var(--text-muted)" style={{ marginBottom: '16px', opacity: 0.6 }} />
                <p style={styles.emptyTitle}>No evaluated candidates yet</p>
                <p style={styles.emptyDesc}>
                  Enter the Job Description details and upload CVs on the left. The evaluation and scores will populate here.
                </p>
              </div>
            )}

            {/* Loading overlay for active evaluation */}
            {loading && (
              <div style={styles.loadingOverlay} className="glass-panel animate-fade-in">
                <div style={styles.loadingContent}>
                  <div style={styles.spinnerRing} />
                  <p style={{ fontWeight: '500', color: 'var(--text-title)' }}>Analyzing Candidate CVs...</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Simulating keyword alignment algorithms...</p>
                </div>
              </div>
            )}

            {/* Candidates Grid */}
            <div style={styles.candidatesGrid}>
              {cvs.map((cv) => {
                const scoreColor = getScoreColor(cv.matchScore);
                
                return (
                  <div
                    key={cv.id}
                    className="glass-card animate-fade-in"
                    style={styles.candidateCard}
                    onClick={() => setSelectedCV(cv)}
                  >
                    <div style={styles.cardLayout}>
                      
                      {/* Radial score progress on left */}
                      <div style={styles.scoreContainer}>
                        <svg width="60" height="60" style={styles.svgRotate}>
                          <circle cx="30" cy="30" r="26" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                          <circle
                            cx="30"
                            cy="30"
                            r="26"
                            fill="transparent"
                            stroke={scoreColor}
                            strokeWidth="4"
                            strokeDasharray="163.3" /* 2 * pi * r = 163.3 */
                            strokeDashoffset={163.3 - (163.3 * cv.matchScore) / 100}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                          />
                        </svg>
                        <span style={{ ...styles.scoreValue, color: scoreColor }}>
                          {cv.matchScore}
                        </span>
                      </div>

                      {/* Info block */}
                      <div style={styles.candInfo}>
                        <h4 style={styles.candName}>{cv.applicantName}</h4>
                        <div style={styles.metaRow}>
                          <FileText size={12} color="var(--text-muted)" />
                          <span style={styles.metaText} title={cv.fileName}>{cv.fileName}</span>
                          <span style={styles.metaSeparator}>•</span>
                          <span>{cv.fileSize}</span>
                        </div>
                        <div style={{ ...styles.metaRow, marginTop: '4px' }}>
                          <Clock size={12} color="var(--text-muted)" />
                          <span style={styles.metaText}>{cv.uploadedAt}</span>
                        </div>
                      </div>

                      {/* Card actions */}
                      <div style={styles.actions}>
                        <button
                          style={styles.deleteButton}
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid opening modal
                            deleteCV(cv.id);
                          }}
                          title="Remove candidate"
                        >
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight size={18} color="var(--text-muted)" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </main>

      {/* Detailed Candidate CV Matching Modal */}
      {selectedCV && selectedCV.matchDetails && (
        <div style={styles.modalOverlay} className="animate-fade-in" onClick={() => setSelectedCV(null)}>
          <div
            className="glass-panel animate-scale-up"
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()} // Prevent closing
          >
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>{selectedCV.applicantName}</h3>
                <p style={styles.modalSubtitle}>Detailed Assessment & Match Analytics</p>
              </div>
              <button style={styles.modalClose} onClick={() => setSelectedCV(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Score Highlight Banner */}
            <div
              style={{
                ...styles.modalBanner,
                backgroundColor: getScoreBgGlow(selectedCV.matchScore),
                borderColor: getScoreColor(selectedCV.matchScore),
              }}
            >
              <div style={styles.bannerLeft}>
                <div
                  style={{
                    ...styles.bannerScoreBox,
                    backgroundColor: getScoreColor(selectedCV.matchScore),
                  }}
                >
                  {selectedCV.matchScore}%
                </div>
                <div>
                  <h4 style={styles.bannerScoreTitle}>Match Compatibility Score</h4>
                  <p style={styles.bannerScoreDesc}>
                    Determined by matching core technical competencies, background details, and experience.
                  </p>
                </div>
              </div>
              <div style={styles.bannerRight}>
                <Sparkles size={20} color={getScoreColor(selectedCV.matchScore)} style={{ animation: 'pulseGlow 2s infinite' }} />
              </div>
            </div>

            {/* Modal Scroll Body */}
            <div style={styles.modalBody}>
              <div style={styles.modalSection}>
                <h4 style={styles.sectionHeading}>
                  <Info size={16} color="var(--accent-indigo)" />
                  Candidate Overview
                </h4>
                <div style={styles.overviewGrid}>
                  <div style={styles.overviewItem}>
                    <span style={styles.overviewLabel}>Experience Level</span>
                    <span style={styles.overviewVal}>{selectedCV.matchDetails.experienceSummary}</span>
                  </div>
                  <div style={styles.overviewItem}>
                    <span style={styles.overviewLabel}>Education & Credentials</span>
                    <span style={styles.overviewVal}>{selectedCV.matchDetails.educationSummary}</span>
                  </div>
                </div>
              </div>

              {/* Skill Matrix lists */}
              <div style={styles.modalSection}>
                <h4 style={styles.sectionHeading}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  Matching Skills (JD Alignments)
                </h4>
                <div style={styles.tagsContainer}>
                  {selectedCV.matchDetails.matchingSkills.length > 0 ? (
                    selectedCV.matchDetails.matchingSkills.map((skill) => (
                      <span key={skill} style={styles.tagMatch}>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span style={styles.noTagsText}>No direct technology matches found in Job Description.</span>
                  )}
                </div>
              </div>

              <div style={styles.modalSection}>
                <h4 style={styles.sectionHeading}>
                  <XCircle size={16} color="var(--accent-rose)" />
                  Missing Skills (Target Gaps)
                </h4>
                <div style={styles.tagsContainer}>
                  {selectedCV.matchDetails.missingSkills.length > 0 ? (
                    selectedCV.matchDetails.missingSkills.map((skill) => (
                      <span key={skill} style={styles.tagMissing}>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span style={{ ...styles.tagMatch, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      No missing requirements detected! (Perfect Match)
                    </span>
                  )}
                </div>
              </div>

              <div style={styles.modalSection}>
                <h4 style={styles.sectionHeading}>
                  <Award size={16} color="var(--accent-purple)" />
                  Additional Advantages (Bonus Value)
                </h4>
                <div style={styles.tagsContainer}>
                  {selectedCV.matchDetails.additionalAdvantages.map((skill) => (
                    <span key={skill} style={styles.tagAdvantage}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ ...styles.modalSection, marginBottom: 0 }}>
                <h4 style={styles.sectionHeading}>
                  <FileText size={16} color="var(--accent-indigo)" />
                  Full Summary Evaluation Report
                </h4>
                <div style={styles.summaryReportBox}>
                  {selectedCV.matchDetails.summaryReport.split('\n\n').map((paragraph, index) => (
                    <p key={index} style={{ marginBottom: '12px' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={styles.modalFooter}>
              <button className="btn-secondary" onClick={() => setSelectedCV(null)} style={{ padding: '10px 20px' }}>
                Close Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Layout configurations
const styles: Record<string, React.CSSProperties> = {
  dashboardContainer: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-main)',
    paddingBottom: '60px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 40px',
    backgroundColor: 'rgba(13, 20, 38, 0.65)',
    borderBottom: '1px solid var(--border-glass)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--text-title)',
    letterSpacing: '-0.02em',
  },
  userInfoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
  },
  userEmail: {
    fontSize: '0.85rem',
    color: 'var(--text-body)',
  },
  logoutBtn: {
    padding: '8px 16px',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  mainContent: {
    marginTop: '40px',
  },
  gridColumns: {
    display: 'grid',
    gridTemplateColumns: '500px 1fr',
    gap: '32px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  panelCard: {
    padding: '32px',
    backgroundColor: 'rgba(12, 18, 36, 0.4)',
    border: '1px solid var(--border-glass)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  panelTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'var(--text-title)',
  },
  panelDesc: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    marginBottom: '16px',
  },
  jdTextarea: {
    minHeight: '220px',
    resize: 'vertical',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    backgroundColor: 'rgba(13, 20, 38, 0.55)',
    border: '1px solid var(--border-glass)',
  },
  jdMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '6px',
  },
  dropZone: {
    border: '2px dashed var(--border-glass)',
    borderRadius: 'var(--radius-lg)',
    padding: '40px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  dropZoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  uploadIconCircle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    marginBottom: '16px',
    border: '1px solid rgba(99, 102, 241, 0.15)',
  },
  dropTextMain: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--text-title)',
    marginBottom: '4px',
  },
  dropTextSub: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  errorText: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--accent-rose)',
    fontSize: '0.85rem',
    marginTop: '16px',
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  resultsTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'var(--text-title)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  countBadge: {
    fontSize: '0.85rem',
    fontWeight: '600',
    padding: '2px 10px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: 'var(--accent-indigo)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '80px 40px',
    backgroundColor: 'rgba(12, 18, 36, 0.2)',
    border: '1px solid var(--border-glass)',
    minHeight: '400px',
  },
  emptyTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'var(--text-title)',
    marginBottom: '8px',
  },
  emptyDesc: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    maxWidth: '400px',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '52px',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 9, 19, 0.7)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  loadingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'center',
  },
  spinnerRing: {
    width: '36px',
    height: '36px',
    border: '3px solid rgba(99, 102, 241, 0.1)',
    borderTopColor: 'var(--accent-indigo)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  candidatesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  candidateCard: {
    padding: '16px 20px',
    cursor: 'pointer',
    backgroundColor: 'rgba(18, 28, 54, 0.25)',
  },
  cardLayout: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  scoreContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60px',
    height: '60px',
    flexShrink: 0,
  },
  svgRotate: {
    transform: 'rotate(-90deg)',
    position: 'absolute',
  },
  scoreValue: {
    fontSize: '1rem',
    fontWeight: '700',
    zIndex: 1,
  },
  candInfo: {
    flexGrow: 1,
    minWidth: 0, // Enable truncation on flex item
  },
  candName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-title)',
    marginBottom: '4px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  metaText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '180px',
  },
  metaSeparator: {
    color: 'var(--border-glass)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  deleteButton: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: 'var(--radius-sm)',
    transition: 'var(--transition-smooth)',
  },
  // Modal Style details
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 5, 12, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '24px',
    backdropFilter: 'blur(8px)',
  },
  modalContent: {
    width: '100%',
    maxWidth: '680px',
    maxHeight: '90vh',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'rgba(12, 18, 36, 0.95)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
  },
  modalHeader: {
    padding: '24px 32px',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: 'var(--text-title)',
  },
  modalSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  modalClose: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: 'var(--radius-full)',
    transition: 'var(--transition-smooth)',
  },
  modalBanner: {
    margin: '0 32px 24px',
    marginTop: '24px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  bannerScoreBox: {
    width: '52px',
    height: '52px',
    borderRadius: 'var(--radius-sm)',
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerScoreTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--text-title)',
    marginBottom: '2px',
  },
  bannerScoreDesc: {
    fontSize: '0.78rem',
    color: 'var(--text-body)',
    maxWidth: '400px',
  },
  modalBody: {
    padding: '0 32px 32px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  modalSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeading: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-title)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  overviewItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
  },
  overviewLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginBottom: '4px',
  },
  overviewVal: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: 'var(--text-body)',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tagMatch: {
    fontSize: '0.8rem',
    fontWeight: '500',
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    color: 'var(--accent-emerald)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
  },
  tagMissing: {
    fontSize: '0.8rem',
    fontWeight: '500',
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    color: 'var(--accent-rose)',
    border: '1px solid rgba(244, 63, 94, 0.15)',
  },
  tagAdvantage: {
    fontSize: '0.8rem',
    fontWeight: '500',
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    color: 'var(--accent-purple)',
    border: '1px solid rgba(139, 92, 246, 0.15)',
  },
  noTagsText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  summaryReportBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 20px',
    fontSize: '0.9rem',
    color: 'var(--text-body)',
    lineHeight: '1.6',
  },
  modalFooter: {
    padding: '16px 32px',
    borderTop: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(6, 9, 19, 0.4)',
  },
  quickUploadArea: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '16px',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-glass)',
  },
  quickUploadText: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
  },
  quickUploadBtn: {
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    color: 'var(--accent-indigo)',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
};
