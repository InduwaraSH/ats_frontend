import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCV } from '../contexts/CVContext';
import type { CV } from '../../domain/entities/CV';

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
  Clock,
  ChevronRight,
  Info,
  X,
  Code,
  ExternalLink,
  Star,
  GitFork,
  Download,
  Plus,
  ChevronDown
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    jobDescription,
    jobTitle,
    jobId,
    cvs,
    selectedCV,
    loading,
    error,
    uploadProgress,
    jobsList,
    saveJobDetails,
    uploadCVs,
    deleteCV,
    setSelectedCV,
    deleteJob,
    startNewJob,
    selectJob,
  } = useCV();

  const [jdText, setJdText] = useState(jobDescription);
  const [titleText, setTitleText] = useState(jobTitle);
  const [idText, setIdText] = useState(jobId);
  const [uploadTitle, setUploadTitle] = useState(jobTitle);
  const [uploadId, setUploadId] = useState(jobId);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<{ total: number; success: number; failed: number } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [bulkMinScore, setBulkMinScore] = useState<number>(67);
  const [bulkMaxScore, setBulkMaxScore] = useState<number>(100);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [needsReviewExpanded, setNeedsReviewExpanded] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'assessment' | 'pdf'>('assessment');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [uploadZoneExpanded, setUploadZoneExpanded] = useState(false);
  const [specCardExpanded, setSpecCardExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize local states when fetched from the backend on load
  useEffect(() => {
    setJdText(jobDescription);
  }, [jobDescription]);

  useEffect(() => {
    setTitleText(jobTitle);
  }, [jobTitle]);

  useEffect(() => {
    setIdText(jobId);
  }, [jobId]);

  useEffect(() => {
    setUploadTitle(jobTitle);
  }, [jobTitle]);

  useEffect(() => {
    setUploadId(jobId);
  }, [jobId]);

  const handleSaveJob = async () => {
    if (!idText.trim() || !titleText.trim() || !jdText.trim()) {
      setSaveStatus('error');
      setSaveMessage('Please fill in Job ID, Job Title, and Job Description.');
      return;
    }

      setSaveStatus('saving');
      setSaveMessage(null);
      try {
        await saveJobDetails(idText.trim(), titleText.trim(), jdText.trim());
        setSaveStatus('success');
        setSaveMessage('Job details saved successfully!');
        setUploadZoneExpanded(true); // Auto-expand upload zone after save
        setTimeout(() => {
          setSaveStatus('idle');
          setSaveMessage(null);
        }, 4000);
      } catch (err: any) {
        setSaveStatus('error');
        setSaveMessage(err.message || 'Failed to save job details.');
      }
  };

  // Synchronize internal text state with global context
  const handleJdChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJdText(e.target.value);
    if (uploadError) setUploadError(null);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), bulkMaxScore - 1);
    setBulkMinScore(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), bulkMinScore + 1);
    setBulkMaxScore(value);
  };

  const activeJobId = uploadId.trim() || jobId.trim();
  
  // 1. Filter by active job
  const jobCVs = cvs.filter((cv) => cv.jobId === activeJobId);
  
  useEffect(() => {
    setSpecCardExpanded(jobCVs.length === 0);
  }, [activeJobId, jobCVs.length]);
  
  // 2. Filter by search text (applicantName, fileName, jobTitle, or matchingSkills)
  const searchedCVs = jobCVs.filter(cv => {
    const searchLower = candidateSearch.toLowerCase().trim();
    if (!searchLower) return true;
    
    const nameMatch = cv.applicantName.toLowerCase().includes(searchLower);
    const fileMatch = cv.fileName.toLowerCase().includes(searchLower);
    const titleMatch = cv.jobTitle?.toLowerCase().includes(searchLower) || false;
    const skillsMatch = cv.matchDetails?.matchingSkills?.some(s => s.toLowerCase().includes(searchLower)) || false;
    
    return nameMatch || fileMatch || titleMatch || skillsMatch;
  });

  // 3. Sort by score descending (highest to lowest) across all pages
  const sortedCVs = [...searchedCVs].sort((a, b) => b.matchScore - a.matchScore);
  
  // 4. Split into compatible vs review lists
  const above50 = sortedCVs.filter((cv) => cv.matchScore >= 50);
  const below50 = sortedCVs.filter((cv) => cv.matchScore < 50);

  // 5. Pagination slicing for compatible candidates
  const itemsPerPage = 10;
  const totalPages = Math.ceil(above50.length / itemsPerPage);
  const paginatedAbove50 = above50.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderCandidateCard = (cv: CV) => {
    const scoreColor = getScoreColor(cv.matchScore || 0);
    return (
      <div
        key={cv.id}
        className="glass-card animate-fade-in"
        style={styles.candidateCard}
        onClick={() => {
          setSelectedCV(cv);
          setActiveModalTab('assessment');
        }}
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
                strokeDasharray="163.3"
                strokeDashoffset={163.3 - (163.3 * (cv.matchScore || 0)) / 100}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div style={styles.scoreValue}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-title)' }}>
                {formatScore(cv.matchScore)}
              </span>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '-2px' }}>%</span>
            </div>
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
                e.stopPropagation();
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

    if (!uploadTitle.trim() || !uploadId.trim()) {
      setUploadError('Please fill in Job Title and Job ID for Resumes.');
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

      if (selectedFiles.length + validFiles.length > 100) {
        setUploadError('Maximum 100 files allowed in queue.');
        return;
      }

      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  // File Select Input Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);

    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
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

      if (selectedFiles.length + validFiles.length > 100) {
        setUploadError('Maximum 100 files allowed in queue.');
        return;
      }

      setSelectedFiles(prev => [...prev, ...validFiles]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartProcessing = async () => {
    if (selectedFiles.length === 0) return;
    setUploadError(null);

    if (!uploadTitle.trim() || !uploadId.trim()) {
      setUploadError('Please fill in Job Title and Job ID for Resumes.');
      return;
    }

    const filesToUpload = [...selectedFiles];
    setSelectedFiles([]); // Clear queue before processing

    try {
      const res = await uploadCVs(filesToUpload, uploadId.trim(), uploadTitle.trim());
      if (res) {
        setUploadSummary({
          total: filesToUpload.length,
          success: res.totalSuccess,
          failed: res.totalFailed
        });
        setUploadZoneExpanded(false); // Auto-collapse upload zone after analyze
      }
    } catch (err: any) {
      setSelectedFiles(filesToUpload); // Restore files on failure
    }
  };

  const handleBulkDownload = () => {
    const targetJobId = activeJobId || jobId;
    if (!targetJobId) {
      alert("Please select or save a job first.");
      return;
    }
    const url = `http://localhost:8000/api/v1/applications/bulk-download?job_id=${encodeURIComponent(targetJobId)}&min_score=${bulkMinScore}&max_score=${bulkMaxScore}`;
    window.open(url, '_blank');
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

  const formatScore = (score: number) => {
    if (score === undefined || score === null) return '0';
    return score % 1 === 0 ? score.toFixed(0) : score.toFixed(1);
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* 1. Left Sidebar (ChatGPT Chat History style) */}
      <aside style={styles.sidebar}>
        {/* Brand Logo Header */}
        <div style={styles.sidebarBrand}>
          <div style={styles.sidebarBrandLogo}>
            <Sparkles size={16} color="var(--accent-indigo)" />
          </div>
          <span style={styles.sidebarBrandText}>ATS Candidate Matcher</span>
        </div>

        {/* New Job Button */}
        <button onClick={startNewJob} className="sidebar-new-job" style={styles.sidebarNewJobBtn}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          <span>New Job</span>
        </button>

        {/* Scrollable Saved Jobs list */}
        <div style={styles.sidebarHistory}>
          <div style={styles.sidebarHistoryTitle}>Recent Jobs</div>
          {jobsList.length === 0 ? (
            loading ? (
              <div style={styles.sidebarHistoryEmpty}>
                <div style={{
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  borderTop: '2px solid var(--accent-indigo)',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 8px auto'
                }}></div>
                <span>Loading...</span>
              </div>
            ) : (
              <div style={styles.sidebarHistoryEmpty}>No saved jobs yet</div>
            )
          ) : (
            <div style={styles.sidebarHistoryList}>
              {jobsList.map((job) => (
                <div
                  key={job.jobId}
                  className="sidebar-history-item-hover sidebar-history-item-el"
                  style={{
                    ...styles.sidebarHistoryItem,
                    backgroundColor: job.jobId === activeJobId ? 'var(--accent-indigo-glow)' : 'transparent',
                    color: job.jobId === activeJobId ? 'var(--accent-indigo)' : 'var(--text-muted)'
                  }}
                  onClick={() => {
                    selectJob(job);
                    setCurrentPage(1);
                  }}
                >
                  <Briefcase size={14} style={{ flexShrink: 0, opacity: job.jobId === activeJobId ? 1 : 0.6, marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span style={{ ...styles.sidebarHistoryItemText, fontWeight: '600', color: job.jobId === activeJobId ? 'var(--accent-indigo)' : 'var(--text-title)' }} title={job.title}>
                      {job.title}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ID: {job.jobId}
                    </span>
                  </div>
                  <button
                    className="delete-history-btn delete-job-btn"
                    style={styles.sidebarHistoryItemDelete}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete job "${job.title}"?`)) {
                        deleteJob(job.jobId);
                        if (job.jobId === activeJobId) {
                          startNewJob();
                        }
                      }
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Footer Button */}
        <div style={styles.sidebarUserSection}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="sidebar-user-btn-el"
            style={styles.sidebarUserBtn}
          >
            <div style={styles.sidebarUserAvatar}>
              {user?.email ? user.email.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <span style={styles.sidebarUserEmail} title={user?.email}>
              {user?.email}
            </span>
            <ChevronDown size={14} style={{ opacity: 0.6 }} />
          </button>

          {/* Profile Dropdown Menu overlay */}
          {profileDropdownOpen && (
            <>
              <div style={styles.sidebarUserDropdownBackdrop} onClick={() => setProfileDropdownOpen(false)} />
              <div style={styles.sidebarUserDropdown} className="glass-panel animate-scale-up">
                <div style={styles.dropdownUserInfo}>
                  <div style={styles.dropdownUserAvatarBig}>
                    {user?.email ? user.email.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.dropdownUserName}>Recruiter Admin</div>
                    <div style={styles.dropdownUserEmail} title={user?.email}>{user?.email}</div>
                  </div>
                </div>
                <div style={styles.dropdownDivider} />
                <button onClick={logout} style={styles.dropdownLogoutBtn}>
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* 2. Main Content Workspace */}
      <div style={styles.mainContent}>
        {/* Header Bar */}
        <header style={styles.mainHeader}>
          {activeJobId ? (
            <div style={styles.mainHeaderJobInfo}>
              <Briefcase size={16} color="var(--accent-indigo)" />
              <span style={styles.mainHeaderJobTitle}>{jobTitle}</span>
              <span style={styles.mainHeaderJobId}>({activeJobId})</span>
            </div>
          ) : (
            <div style={styles.mainHeaderJobInfo}>
              <Sparkles size={16} color="var(--accent-indigo)" />
              <span style={styles.mainHeaderJobTitle}>New Assessment Setup</span>
            </div>
          )}

          {/* Header Action: Stats display only */}
          {(activeJobId && jobCVs.length > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)', display: 'inline-block' }} />
                <span><strong style={{ color: 'var(--accent-emerald)' }}>{above50.length}</strong> selected</span>
                <span style={{ color: 'var(--border-glass-hover)' }}>|</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-rose)', display: 'inline-block' }} />
                <span><strong style={{ color: 'var(--accent-rose)' }}>{below50.length}</strong> review</span>
              </div>
            </div>
          )}
        </header>

        {/* Workspace + Right Score Panel layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Scrollable Center Body Area */}
        <div style={styles.workspaceBody}>
          {activeJobId.trim() === '' ? (
            /* EMPTY STATE: Welcoming Job description setup */
            <div style={styles.emptyWelcomeContainer} className="animate-fade-in">
              <div style={styles.emptyWelcomeIconCircle}>
                <Sparkles size={32} color="var(--accent-indigo)" />
              </div>
              <h2 style={styles.emptyWelcomeTitle}>Create New Job Alignment</h2>
              <p style={styles.emptyWelcomeSubtitle}>
                Define the requirements and description for the role to extract and rank candidate CVs.
              </p>

              <div className="glass-card animate-scale-up" style={styles.emptyWelcomeFormCard}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Job Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Senior Mobile App Developer"
                    value={titleText}
                    onChange={(e) => {
                      setTitleText(e.target.value);
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Job ID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. JOB_1234"
                    value={idText}
                    onChange={(e) => {
                      setIdText(e.target.value);
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Job Description</label>
                  <textarea
                    className="form-control"
                    style={styles.jdTextarea}
                    placeholder="Paste job targets, requirements, and keywords here... e.g. We need a Flutter developer with Firebase, Node.js and REST APIs experience..."
                    value={jdText}
                    onChange={handleJdChange}
                    rows={6}
                  />
                  <div style={styles.jdMeta}>
                    <span>{jdText.length} characters</span>
                    <span>{jdText.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={handleSaveJob}
                  disabled={saveStatus === 'saving'}
                  style={{ width: '100%', padding: '12px' }}
                >
                  {saveStatus === 'saving' ? 'Creating Job Specification...' : 'Create Job Requirements'}
                </button>

                {saveMessage && (
                  <div
                    style={{
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: saveStatus === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: saveStatus === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                      border: `1px solid ${saveStatus === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}`,
                      marginTop: '16px'
                    }}
                    className="animate-fade-in"
                  >
                    {saveStatus === 'success' ? (
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    ) : (
                      <XCircle size={16} color="var(--accent-rose)" />
                    )}
                    <span>{saveMessage}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ACTIVE STATE: Show Upload & Candidate List */
            <div style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Job Specifications Card */}
              <div className="glass-card animate-scale-up" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setSpecCardExpanded(!specCardExpanded)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={16} color="var(--accent-indigo)" />
                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-title)', margin: 0 }}>
                      Job Specifications
                    </span>
                    {jobCVs.length > 0 && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-rose)', backgroundColor: 'var(--accent-rose-glow)', padding: '2px 8px', borderRadius: '4px', marginLeft: '8px', fontWeight: '600' }}>
                        Locked (CVs Evaluated)
                      </span>
                    )}
                  </div>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-indigo)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {specCardExpanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>

                {specCardExpanded && (
                  <div className="animate-fade-in" style={{ marginTop: '16px' }}>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">Job Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Senior Mobile App Developer"
                        value={titleText}
                        onChange={(e) => setTitleText(e.target.value)}
                        disabled={jobCVs.length > 0}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">Job ID (Read-only)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. JOB_1234"
                        value={idText}
                        disabled
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label">Job Description</label>
                      <textarea
                        className="form-control"
                        style={styles.jdTextarea}
                        placeholder="Paste job specifications here..."
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        disabled={jobCVs.length > 0}
                        rows={4}
                      />
                    </div>

                    {jobCVs.length === 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          className="btn-primary"
                          onClick={handleSaveJob}
                          disabled={saveStatus === 'saving'}
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                          {saveStatus === 'saving' ? 'Updating Specifications...' : 'Update Job Specifications'}
                        </button>
                        {saveMessage && (
                          <div
                            style={{
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: saveStatus === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: saveStatus === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                              border: `1px solid ${saveStatus === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}`,
                              marginTop: '4px'
                            }}
                            className="animate-fade-in"
                          >
                            {saveStatus === 'success' ? (
                              <CheckCircle2 size={14} color="var(--accent-emerald)" />
                            ) : (
                              <XCircle size={14} color="var(--accent-rose)" />
                            )}
                            <span>{saveMessage}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Collapsible/Toggleable CV Upload Dropzone */}
              <div className="glass-card" style={{ padding: '20px 24px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UploadCloud size={16} color="var(--accent-indigo)" />
                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-title)' }}>
                      {cvs.length > 0 ? 'Upload More Candidate CVs' : 'Upload Candidate Resumes'}
                    </span>
                  </div>
                  {cvs.length > 0 && (
                    <button
                      onClick={() => setUploadZoneExpanded(!uploadZoneExpanded)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-indigo)',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {uploadZoneExpanded ? 'Collapse' : 'Expand Dropzone'}
                        <ChevronDown size={14} style={{ transform: uploadZoneExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
                      </span>
                    </button>
                  )}
                </div>

                {(cvs.length === 0 || uploadZoneExpanded) && (
                  <div className="upload-zone-expand" style={{ marginTop: '16px' }}>
                    <p style={{ ...styles.panelDesc, marginBottom: '16px' }}>
                      Drag & drop candidate CVs (PDF, TXT, DOCX) to analyze their suitability.
                    </p>

                    {/* Hidden Inputs representing upload settings */}
                    <div style={{ display: 'none' }}>
                      <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
                      <input type="text" value={uploadId} onChange={(e) => setUploadId(e.target.value)} />
                    </div>

                    {/* Upload Drop Zone */}
                    <div
                      style={{
                        ...styles.dropZone,
                        borderColor: dragActive ? 'var(--accent-indigo)' : 'var(--border-glass)',
                        backgroundColor: dragActive ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                        boxShadow: dragActive ? 'var(--shadow-glow)' : 'none',
                        padding: '32px 20px'
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
                          <UploadCloud size={24} color="var(--accent-indigo)" />
                        </div>
                        <p style={styles.dropTextMain}>Drag CV files here or click to browse</p>
                        <p style={styles.dropTextSub}>Supports PDF, Text, and Word files up to 5MB</p>
                      </div>
                    </div>

                    {/* Selected Files Queue List & Analyze Button */}
                    {selectedFiles.length > 0 && (
                      <div style={{ marginTop: '16px' }} className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-title)' }}>
                            Selected Files ({selectedFiles.length})
                          </span>
                          <button 
                            onClick={() => setSelectedFiles([])} 
                            style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                          >
                            Clear All
                          </button>
                        </div>
                        
                        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '8px', backgroundColor: 'rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                          {selectedFiles.map((file, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-glass)', border: '1px solid rgba(255,255,255,0.02)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                                <FileText size={14} color="var(--text-muted)" />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {file.name}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {Math.round(file.size / 1024)} KB
                              </span>
                            </div>
                          ))}
                        </div>

                        <button
                          className="btn-primary animate-pulse"
                          onClick={() => {
                            handleStartProcessing();
                            setUploadZoneExpanded(false);
                          }}
                          disabled={loading}
                          style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <Sparkles size={16} />
                          <span>Analyze Selected CVs ({selectedFiles.length})</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error messages */}
              {(uploadError || error) && (
                <div style={styles.errorText} className="animate-fade-in">
                  <Info size={16} />
                  <span>{uploadError || error}</span>
                </div>
              )}

              {/* Evaluated Candidates Grid view in center */}
              {cvs.length > 0 && (
                <div className="glass-card" style={{ padding: '24px 32px' }}>
                  {/* Search Bar */}
                  <div style={{ marginBottom: '24px' }}>
                    <input
                      type="text"
                      placeholder="Search candidates by name, file, or matching skills..."
                      value={candidateSearch}
                      onChange={(e) => {
                        setCandidateSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="form-control"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '0.9rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-glass)',
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        color: 'var(--text-title)'
                      }}
                    />
                  </div>

                  {/* Candidates Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {above50.length > 0 ? (
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--accent-emerald)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle2 size={16} color="var(--accent-emerald)" />
                          Highly Compatible Candidates (Score ≥ 50)
                          <span style={{ ...styles.countBadge, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)' }}>{above50.length}</span>
                        </h4>
                        <div style={styles.candidatesGrid}>
                          {paginatedAbove50.map(renderCandidateCard)}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                              Previous
                            </button>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              Page {currentPage} of {totalPages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      cvs.length > 0 && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                          No candidates match the search query.
                        </p>
                      )
                    )}

                    {below50.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '24px', marginTop: '12px' }}>
                        <button
                          onClick={() => setNeedsReviewExpanded(!needsReviewExpanded)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            background: 'rgba(244, 63, 94, 0.03)',
                            border: '1px solid rgba(244, 63, 94, 0.15)',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px 20px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'var(--transition-smooth)',
                            color: 'var(--accent-rose)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <XCircle size={18} color="var(--accent-rose)" />
                            <span style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-rose)' }}>
                              Needs Review Candidates (Score &lt; 50)
                            </span>
                            <span style={{ ...styles.countBadge, backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)' }}>{below50.length}</span>
                          </div>
                          <span style={{ transform: needsReviewExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: 'var(--accent-rose)', fontSize: '0.8rem' }}>
                            ▼
                          </span>
                        </button>
                        {needsReviewExpanded && (
                          <div className="animate-slide-down" style={{ ...styles.candidatesGrid, marginTop: '20px' }}>
                            {below50.map(renderCandidateCard)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right-side Score Range Panel (only when CVs exist) */}
        {(activeJobId && jobCVs.length > 0) && (
          <div style={{
            width: '220px',
            flexShrink: 0,
            borderLeft: '1px solid var(--border-glass)',
            backgroundColor: 'var(--bg-surface-glass)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 20px',
            gap: '24px',
            overflowY: 'auto',
          }}>
            {/* Score Filter */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                ZIP Score Filter
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-indigo)' }}>{bulkMinScore}%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>to</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-indigo)' }}>{bulkMaxScore}%</span>
              </div>
              <div className="double-slider-container" style={{ width: '100%', marginBottom: '6px' }}>
                <div className="double-slider-track" />
                <div className="double-slider-range" style={{ left: `${bulkMinScore}%`, width: `${bulkMaxScore - bulkMinScore}%` }} />
                <input type="range" min="0" max="100" value={bulkMinScore} onChange={handleMinChange} className="double-slider-input" />
                <input type="range" min="0" max="100" value={bulkMaxScore} onChange={handleMaxChange} className="double-slider-input" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <span>0%</span><span>100%</span>
              </div>
              <button onClick={handleBulkDownload} className="btn-primary" style={{ width: '100%', padding: '9px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Download size={14} />
                ZIP Download
              </button>
              <div style={{ 
                fontSize: '0.74rem', 
                color: 'var(--text-muted)', 
                marginTop: '10px', 
                textAlign: 'center', 
                backgroundColor: 'rgba(0, 0, 0, 0.02)', 
                padding: '6px 8px', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px dashed var(--border-glass)' 
              }}>
                Matches <strong style={{ color: 'var(--accent-indigo)' }}>{jobCVs.filter(cv => cv.matchDetails && cv.matchDetails.score >= bulkMinScore && cv.matchDetails.score <= bulkMaxScore).length}</strong> of <strong style={{ color: 'var(--text-title)' }}>{jobCVs.length}</strong> CVs
              </div>
            </div>

            {/* Candidate Stats */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                Candidates
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'rgba(5, 150, 105, 0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(5, 150, 105, 0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-body)' }}>
                    <CheckCircle2 size={13} color="var(--accent-emerald)" />
                    Selected
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>{above50.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'rgba(220, 38, 38, 0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(220, 38, 38, 0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-body)' }}>
                    <XCircle size={13} color="var(--accent-rose)" />
                    Needs Review
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-rose)' }}>{below50.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'rgba(15, 23, 42, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-body)' }}>
                    <Award size={13} color="var(--accent-indigo)" />
                    Total
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-title)' }}>{jobCVs.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>{/* end flex row wrapper */}
      </div>

      {/* 3. Floating progress notification toast popup (Google Drive/ChatGPT style) */}
      {uploadProgress && (
        <div style={styles.floatingProgressCard} className="animate-scale-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} className="animate-spin" style={{ color: 'var(--accent-indigo)' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-title)' }}>
                {uploadProgress.status === 'completed' ? 'Processing Complete' : 'Processing Resumes...'}
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            File {uploadProgress.current} of {uploadProgress.total}: {uploadProgress.fileName}
          </p>
          <div style={styles.progressBarTrack}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${(uploadProgress.current / uploadProgress.total) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Initial loading state progress popup */}
      {(loading && !uploadProgress) && (
        <div style={styles.floatingProgressCard} className="animate-scale-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} className="animate-spin" style={{ color: 'var(--accent-indigo)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-title)' }}>Preparing uploads...</span>
          </div>
          <div style={{ ...styles.progressBarTrack, marginTop: '12px' }}>
            <div style={{ ...styles.progressBarFill, width: '20%', animation: 'progressPulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      )}

      {/* CV Processing Completion Modal */}
      {uploadSummary && (
        <div style={styles.modalOverlay} className="animate-fade-in">
          <div
            className="glass-panel animate-scale-up"
            style={{ ...styles.modalContent, maxWidth: '420px', padding: '32px', textAlign: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <CheckCircle2 size={36} color="var(--accent-emerald)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-title)', marginBottom: '8px' }}>CV Processing Complete</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                All uploaded CVs have been parsed and assessed.
              </p>
            </div>
            <div style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-title)' }}>{uploadSummary.total}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-glass)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>{uploadSummary.success}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Succeeded</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-glass)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-rose)' }}>{uploadSummary.failed}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Failed</div>
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={() => setUploadSummary(null)}
              style={{ width: '100%', padding: '12px' }}
            >
              Done / View Results
            </button>
          </div>
        </div>
      )}

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
                {/* Profile Links */}
                {(selectedCV.githubUrl || selectedCV.linkedinUrl) && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {selectedCV.githubUrl && (
                      <a
                        href={selectedCV.githubUrl.startsWith('http') ? selectedCV.githubUrl : `https://${selectedCV.githubUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: '600', color: 'var(--accent-indigo)', textDecoration: 'none', backgroundColor: 'var(--accent-indigo-glow)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.2)' }}
                      >
                        <Code size={12} />
                        GitHub
                        <ExternalLink size={10} />
                      </a>
                    )}
                    {selectedCV.linkedinUrl && (
                      <a
                        href={selectedCV.linkedinUrl.startsWith('http') ? selectedCV.linkedinUrl : `https://${selectedCV.linkedinUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: '600', color: '#0a66c2', textDecoration: 'none', backgroundColor: 'rgba(10, 102, 194, 0.08)', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(10, 102, 194, 0.2)' }}
                      >
                        <ExternalLink size={10} />
                        LinkedIn
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}
              </div>
              <button style={styles.modalClose} onClick={() => setSelectedCV(null)}>
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Tabs Selector */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', padding: '0 32px', backgroundColor: 'var(--bg-surface)' }}>
              <button
                onClick={() => setActiveModalTab('assessment')}
                style={{
                  padding: '16px 20px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: activeModalTab === 'assessment' ? 'var(--accent-indigo)' : 'var(--text-muted)',
                  borderBottom: activeModalTab === 'assessment' ? '2px solid var(--accent-indigo)' : '2px solid transparent',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Assessment Report
              </button>
              <button
                onClick={() => setActiveModalTab('pdf')}
                style={{
                  padding: '16px 20px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: activeModalTab === 'pdf' ? 'var(--accent-indigo)' : 'var(--text-muted)',
                  borderBottom: activeModalTab === 'pdf' ? '2px solid var(--accent-indigo)' : '2px solid transparent',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Original Resume PDF
              </button>
            </div>

            {activeModalTab === 'assessment' ? (
              <>
                {/* Score Highlight Banner */}
                <div
                  style={{
                    ...styles.modalBanner,
                    backgroundColor: getScoreBgGlow(selectedCV.matchScore || 0),
                    borderColor: getScoreColor(selectedCV.matchScore || 0),
                  }}
                >
                  <div style={styles.bannerLeft}>
                    <div
                      style={{
                        ...styles.bannerScoreBox,
                        backgroundColor: getScoreColor(selectedCV.matchScore || 0),
                      }}
                    >
                      {formatScore(selectedCV.matchScore)}%
                    </div>
                    <div>
                      <h4 style={styles.bannerScoreTitle}>Match Compatibility Score</h4>
                      <p style={styles.bannerScoreDesc}>
                        Determined by matching core technical competencies, background details, and experience.
                      </p>
                    </div>
                  </div>
                  <div style={styles.bannerRight}>
                    <Sparkles size={20} color={getScoreColor(selectedCV.matchScore || 0)} style={{ animation: 'pulseGlow 2s infinite' }} />
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

                  {/* Matching Skills Section */}
                  <div style={styles.modalSection}>
                    <h4 style={styles.sectionHeading}>
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                      Matching Skills (JD Alignments)
                    </h4>
                    <div style={styles.tagsContainer}>
                      {selectedCV.matchDetails.matchingSkills.length === 0 ? (
                        <p style={styles.noTagsText}>No matching skills identified.</p>
                      ) : (
                        selectedCV.matchDetails.matchingSkills.map((skill) => (
                          <span key={skill} style={styles.tagMatch}>
                            {skill}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Missing Skills Section */}
                  <div style={styles.modalSection}>
                    <h4 style={styles.sectionHeading}>
                      <XCircle size={16} color="var(--accent-rose)" />
                      Missing Skills (Target Gaps)
                    </h4>
                    <div style={styles.tagsContainer}>
                      {selectedCV.matchDetails.missingSkills.length === 0 ? (
                        <span style={{ ...styles.tagMatch, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>No missing requirements detected! (Perfect Match)</span>
                      ) : (
                        selectedCV.matchDetails.missingSkills.map((skill) => (
                          <span key={skill} style={styles.tagMissing}>
                            {skill}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Additional Advantages Section */}
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

                  {/* GitHub Repositories Section */}
                  <div style={styles.modalSection}>
                    <h4 style={styles.sectionHeading}>
                      <Code size={16} color="var(--text-title)" />
                      GitHub Repositories & Tech Alignments
                    </h4>
                    
                    {(!selectedCV.matchDetails.github_projects || selectedCV.matchDetails.github_projects.length === 0) ? (
                      <p style={styles.noTagsText}>No public GitHub repositories detected in candidate contact URLs.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
                        {selectedCV.matchDetails.github_projects.map((proj: any) => (
                          <div
                            key={proj.html_url}
                            style={{
                              padding: '16px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'rgba(0, 0, 0, 0.02)',
                              border: '1px solid var(--border-glass)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                              <a
                                href={proj.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '1rem',
                                  fontWeight: '600',
                                  color: 'var(--accent-indigo)',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <ExternalLink size={15} />
                                {proj.name}
                              </a>
                              
                              {/* Match Indicator */}
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: proj.is_aligned ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                                  color: proj.is_aligned ? 'var(--accent-emerald)' : 'var(--text-muted)',
                                  border: proj.is_aligned ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid var(--border-glass)'
                                }}
                              >
                                {proj.is_aligned ? 'Stack Aligned' : 'General Project'}
                              </span>
                            </div>
                            
                            {/* Description */}
                            {proj.description && (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: '1.4', margin: 0 }}>
                                {proj.description}
                              </p>
                            )}
                            
                            {/* Repo Stats and Languages */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {/* Stats */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Star size={12} /> {proj.stars}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <GitFork size={12} /> {proj.forks}
                                </span>
                              </div>
                              
                              {/* Languages */}
                              {proj.languages && proj.languages.length > 0 && (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {proj.languages.slice(0, 3).map((lang: string) => (
                                    <span key={lang} style={{ backgroundColor: 'rgba(0, 0, 0, 0.03)', padding: '2px 6px', borderRadius: '4px' }}>
                                      {lang}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Matching Stack tags */}
                            {proj.matching_skills && proj.matching_skills.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>Target Matches:</span>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {proj.matching_skills.map((skill: string) => (
                                    <span
                                      key={skill}
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: '600',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                        color: 'var(--accent-emerald)',
                                        border: '1px solid rgba(16, 185, 129, 0.15)'
                                      }}
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
              </>
            ) : (
              /* Live PDF Viewer Tab */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)', position: 'relative' }}>
                <iframe
                  src={`http://localhost:8000/api/v1/applications/${selectedCV.id}/download?inline=true#view=FitH&toolbar=0`}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', flex: 1 }}
                  title="Original Resume PDF"
                />
              </div>
            )}
            
            {/* Modal Footer */}
            <div style={styles.modalFooter}>
              <a
                href={`http://localhost:8000/api/v1/applications/${selectedCV.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginRight: '12px',
                  padding: '10px 20px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <Download size={16} />
                <span>Download CV</span>
              </a>
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
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-main)',
    overflow: 'hidden',
  },
  sidebar: {
    width: '280px',
    backgroundColor: 'var(--bg-surface-glass)',
    backdropFilter: 'var(--glass-blur)',
    borderRight: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flexShrink: 0,
    zIndex: 10,
    position: 'relative',
  },
  sidebarBrand: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid var(--border-glass)',
  },
  sidebarBrandLogo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: 'var(--accent-indigo-glow)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
  },
  sidebarBrandText: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-title)',
  },
  sidebarNewJobBtn: {
    margin: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-title)',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  sidebarHistory: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 20px 20px',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHistoryTitle: {
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '10px',
    letterSpacing: '0.05em',
  },
  sidebarHistoryEmpty: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    padding: '12px 8px',
  },
  sidebarHistoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sidebarHistoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
    fontSize: '0.88rem',
    position: 'relative',
  },
  sidebarHistoryItemText: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sidebarHistoryItemDelete: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarUserSection: {
    padding: '16px 20px',
    borderTop: '1px solid var(--border-glass)',
    position: 'relative',
  },
  sidebarUserBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: 'var(--text-title)',
    transition: 'var(--transition-smooth)',
  },
  sidebarUserAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-indigo)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.75rem',
  },
  sidebarUserEmail: {
    flex: 1,
    fontSize: '0.85rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: '600',
  },
  sidebarUserDropdownBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  sidebarUserDropdown: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    left: '20px',
    right: '20px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-glass)',
    boxShadow: 'var(--shadow-premium)',
    zIndex: 100,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  dropdownUserInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px',
  },
  dropdownUserAvatarBig: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-indigo)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.88rem',
  },
  dropdownUserName: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: 'var(--text-title)',
  },
  dropdownUserEmail: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '160px',
  },
  dropdownLogoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 10px',
    background: 'none',
    border: 'none',
    color: 'var(--accent-rose)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.85rem',
    fontWeight: '600',
    textAlign: 'left',
    transition: 'var(--transition-smooth)',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-main)',
  },
  mainHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 32px',
    borderBottom: '1px solid var(--border-glass)',
    backgroundColor: 'var(--bg-surface-glass)',
    backdropFilter: 'blur(8px)',
    height: '56px',
    flexShrink: 0,
  },
  mainHeaderJobInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--text-title)',
  },
  mainHeaderJobTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '300px',
  },
  mainHeaderJobId: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  workspaceBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
  },
  emptyWelcomeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 'auto',
    maxWidth: '680px',
    width: '100%',
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyWelcomeIconCircle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-indigo-glow)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    marginBottom: '20px',
  },
  emptyWelcomeTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: 'var(--text-title)',
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  emptyWelcomeSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    marginBottom: '32px',
    lineHeight: '1.5',
  },
  emptyWelcomeFormCard: {
    width: '100%',
    padding: '32px',
    backgroundColor: 'var(--bg-card-glass)',
    border: '1px solid var(--border-glass)',
    textAlign: 'left',
  },
  floatingProgressCard: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 1000,
    width: '360px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-glass)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-premium)',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
  },
  progressBarTrack: {
    height: '6px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    marginTop: '6px',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'var(--accent-indigo)',
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.4s ease',
  },
  panelCard: {
    padding: '32px',
    backgroundColor: 'var(--bg-card-glass)',
    border: '1px solid var(--border-glass)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  panelTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--text-title)',
    margin: 0,
  },
  panelDesc: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    marginBottom: '20px',
    lineHeight: '1.4',
  },
  jdTextarea: {
    width: '100%',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-glass)',
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
    backgroundColor: 'var(--accent-indigo-glow)',
    marginBottom: '16px',
    border: '1px solid rgba(99, 102, 241, 0.15)',
  },
  dropTextMain: {
    fontSize: '0.92rem',
    fontWeight: '600',
    color: 'var(--text-title)',
    marginBottom: '6px',
  },
  dropTextSub: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
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
    backgroundColor: 'var(--bg-card-glass)',
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
    minWidth: 0,
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '24px',
    backdropFilter: 'blur(8px)',
  },
  modalContent: {
    width: '100%',
    maxWidth: '1000px',
    height: '85vh',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--bg-surface)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-premium)',
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
    padding: '0 12px',
    height: '52px',
    minWidth: '52px',
    borderRadius: 'var(--radius-sm)',
    color: '#fff',
    fontSize: '1.1rem',
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
    flex: 1,
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
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
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
  },
  summaryReportBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
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
    backgroundColor: 'var(--bg-main)',
  },
};
