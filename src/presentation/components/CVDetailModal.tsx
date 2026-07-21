import React, { useState } from 'react';
import type { CV } from '../../domain/entities/CV';
import { API_BASE_URL } from '../../infrastructure/config/apiConfig';
import {
  X,
  Code,
  ExternalLink,
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  Download,
  FileText,
  Star,
  GitFork,
} from 'lucide-react';

interface CVDetailModalProps {
  selectedCV: CV | null;
  onClose: () => void;
}

export const CVDetailModal: React.FC<CVDetailModalProps> = ({ selectedCV, onClose }) => {
  const [activeModalTab, setActiveModalTab] = useState<'assessment' | 'pdf'>('assessment');

  if (!selectedCV || !selectedCV.matchDetails) return null;

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

  const formatScore = (score?: number) => {
    if (score === undefined || score === null) return '0';
    return score % 1 === 0 ? score.toFixed(0) : score.toFixed(1);
  };

  const details = selectedCV.matchDetails;

  return (
    <div style={styles.modalOverlay} className="animate-fade-in" onClick={onClose}>
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
                    href={
                      selectedCV.githubUrl.startsWith('http')
                        ? selectedCV.githubUrl
                        : `https://${selectedCV.githubUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      color: 'var(--accent-indigo)',
                      textDecoration: 'none',
                      backgroundColor: 'var(--accent-indigo-glow)',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      border: '1px solid rgba(99,102,241,0.2)',
                    }}
                  >
                    <Code size={12} />
                    GitHub
                    <ExternalLink size={10} />
                  </a>
                )}
                {selectedCV.linkedinUrl && (
                  <a
                    href={
                      selectedCV.linkedinUrl.startsWith('http')
                        ? selectedCV.linkedinUrl
                        : `https://${selectedCV.linkedinUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      color: '#0a66c2',
                      textDecoration: 'none',
                      backgroundColor: 'rgba(10, 102, 194, 0.08)',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      border: '1px solid rgba(10, 102, 194, 0.2)',
                    }}
                  >
                    <ExternalLink size={10} />
                    LinkedIn
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}
          </div>
          <button style={styles.modalClose} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs Selector */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-glass)',
            padding: '0 32px',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <button
            onClick={() => setActiveModalTab('assessment')}
            style={{
              padding: '16px 20px',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: activeModalTab === 'assessment' ? 'var(--accent-indigo)' : 'var(--text-muted)',
              borderBottom:
                activeModalTab === 'assessment'
                  ? '2px solid var(--accent-indigo)'
                  : '2px solid transparent',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
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
              borderBottom:
                activeModalTab === 'pdf'
                  ? '2px solid var(--accent-indigo)'
                  : '2px solid transparent',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)',
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
                  <h4 style={styles.bannerScoreTitle}>Overall Qualification Score</h4>
                  <p style={styles.bannerScoreDesc}>
                    {details.recommendation || 'Evaluated against job profile'}
                  </p>
                </div>
              </div>
              {(selectedCV.matchScore || 0) >= 75 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: 'var(--accent-emerald)',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid rgba(5, 150, 105, 0.2)',
                  }}
                >
                  <Award size={16} />
                  <span>Top Candidate Match</span>
                </div>
              )}
            </div>

            <div style={styles.modalBody}>
              {/* Category Scores Breakdown */}
              {details.categoryScores && (
                <div style={styles.modalSection}>
                  <h4 style={styles.sectionHeading}>
                    <Award size={16} color="var(--accent-indigo)" />
                    Detailed Category Scores
                  </h4>
                  <div style={styles.overviewGrid}>
                    <div style={styles.overviewItem}>
                      <span style={styles.overviewLabel}>Skills Match Score</span>
                      <span
                        style={{
                          ...styles.overviewVal,
                          color: getScoreColor(details.categoryScores.skills_match || 0),
                        }}
                      >
                        {formatScore(details.categoryScores.skills_match)}%
                      </span>
                    </div>
                    <div style={styles.overviewItem}>
                      <span style={styles.overviewLabel}>Experience Level</span>
                      <span
                        style={{
                          ...styles.overviewVal,
                          color: getScoreColor(details.categoryScores.experience_match || 0),
                        }}
                      >
                        {formatScore(details.categoryScores.experience_match)}%
                      </span>
                    </div>
                    <div style={styles.overviewItem}>
                      <span style={styles.overviewLabel}>Education & Credentials</span>
                      <span
                        style={{
                          ...styles.overviewVal,
                          color: getScoreColor(details.categoryScores.education_match || 0),
                        }}
                      >
                        {formatScore(details.categoryScores.education_match)}%
                      </span>
                    </div>
                    <div style={styles.overviewItem}>
                      <span style={styles.overviewLabel}>Culture & Fit</span>
                      <span
                        style={{
                          ...styles.overviewVal,
                          color: getScoreColor(details.categoryScores.culture_fit || 0),
                        }}
                      >
                        {formatScore(details.categoryScores.culture_fit)}%
                      </span>
                    </div>
                    {details.categoryScores.github_activity !== undefined && (
                      <div style={styles.overviewItem}>
                        <span style={styles.overviewLabel}>GitHub Profile Activity</span>
                        <span
                          style={{
                            ...styles.overviewVal,
                            color: getScoreColor(details.categoryScores.github_activity || 0),
                          }}
                        >
                          {formatScore(details.categoryScores.github_activity)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skills Analysis */}
              <div style={styles.modalSection}>
                <h4 style={styles.sectionHeading}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  Matched Required Skills
                </h4>
                <div style={styles.tagsContainer}>
                  {details.matchingSkills && details.matchingSkills.length > 0 ? (
                    details.matchingSkills.map((skill: string, idx: number) => (
                      <span key={idx} style={styles.tagMatch}>
                        ✓ {skill}
                      </span>
                    ))
                  ) : (
                    <span style={styles.noTagsText}>No direct skill matches detected.</span>
                  )}
                </div>
              </div>

              {details.missingSkills && details.missingSkills.length > 0 && (
                <div style={styles.modalSection}>
                  <h4 style={styles.sectionHeading}>
                    <XCircle size={16} color="var(--accent-rose)" />
                    Missing / Desired Skills
                  </h4>
                  <div style={styles.tagsContainer}>
                    {details.missingSkills.map((skill: string, idx: number) => (
                      <span key={idx} style={styles.tagMissing}>
                        ✕ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {details.additionalAdvantages && details.additionalAdvantages.length > 0 && (
                <div style={styles.modalSection}>
                  <h4 style={styles.sectionHeading}>
                    <Sparkles size={16} color="var(--accent-purple)" />
                    Bonus / Value-Add Skills
                  </h4>
                  <div style={styles.tagsContainer}>
                    {details.additionalAdvantages.map((skill: string, idx: number) => (
                      <span key={idx} style={styles.tagAdvantage}>
                        + {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Evaluation Section */}
              <div style={styles.modalSection}>
                <h4 style={styles.sectionHeading}>
                  <Code size={16} color="var(--accent-indigo)" />
                  Projects & Technical Work
                </h4>
                {details.github_projects && details.github_projects.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {details.github_projects.map((proj, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: 'var(--radius-md)',
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          {proj.html_url ? (
                            <a
                              href={proj.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: 'var(--accent-indigo)',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <ExternalLink size={15} />
                              {proj.name}
                            </a>
                          ) : (
                            <span
                              style={{
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: 'var(--text-title)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <FileText size={15} color="var(--text-muted)" />
                              {proj.name}
                            </span>
                          )}

                          {/* Match and Contributed Indicators */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {proj.is_fork && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                  color: 'var(--accent-indigo)',
                                  border: '1px solid rgba(99, 102, 241, 0.15)',
                                }}
                              >
                                Contributed Project
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: proj.is_aligned
                                  ? 'rgba(16, 185, 129, 0.08)'
                                  : 'rgba(0, 0, 0, 0.04)',
                                color: proj.is_aligned
                                  ? 'var(--accent-emerald)'
                                  : 'var(--text-muted)',
                                border: proj.is_aligned
                                  ? '1px solid rgba(16, 185, 129, 0.15)'
                                  : '1px solid var(--border-glass)',
                              }}
                            >
                              {proj.is_aligned ? 'Stack Aligned' : 'General Project'}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {proj.description && (
                          <p
                            style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-body)',
                              lineHeight: '1.4',
                              margin: 0,
                            }}
                          >
                            {proj.description}
                          </p>
                        )}

                        {/* Repo Stats and Languages */}
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '16px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {proj.html_url && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Star size={12} /> {proj.stars}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <GitFork size={12} /> {proj.forks}
                              </span>
                            </div>
                          )}

                          {proj.languages && proj.languages.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {proj.languages.slice(0, 3).map((lang: string) => (
                                <span
                                  key={lang}
                                  style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {lang}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Matching Stack tags */}
                        {proj.matching_skills && proj.matching_skills.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'wrap',
                              marginTop: '4px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                color: 'var(--text-muted)',
                              }}
                            >
                              Target Matches:
                            </span>
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
                                    border: '1px solid rgba(16, 185, 129, 0.15)',
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
                ) : (
                  <span style={styles.noTagsText}>No repository projects evaluated.</span>
                )}
              </div>

              {/* Full Summary Evaluation Report */}
              {details.summaryReport && (
                <div style={{ ...styles.modalSection, marginBottom: 0 }}>
                  <h4 style={styles.sectionHeading}>
                    <FileText size={16} color="var(--accent-indigo)" />
                    Full Summary Evaluation Report
                  </h4>
                  <div style={styles.summaryReportBox}>
                    {details.summaryReport.split('\n\n').map((paragraph: string, index: number) => (
                      <p key={index} style={{ marginBottom: '12px' }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Live PDF Viewer Tab */
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-main)',
              position: 'relative',
            }}
          >
            <iframe
              src={`${API_BASE_URL}/applications/${selectedCV.id}/download?inline=true#view=FitH&toolbar=0`}
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
            href={`${API_BASE_URL}/applications/${selectedCV.id}/download`}
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
          <button className="btn-secondary" onClick={onClose} style={{ padding: '10px 20px' }}>
            Close Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
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
    zIndex: 1100,
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
    alignItems: 'center',
  },
};
