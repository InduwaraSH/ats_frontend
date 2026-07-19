import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, Mail, User, Briefcase, AlertTriangle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';

interface SignupPageProps {
  onNavigateToLogin: () => void;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigateToLogin }) => {
  const { signup, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setValidationError('All fields are required.');
      return;
    }
    if (fullName.trim().length < 2) {
      setValidationError('Full name must be at least 2 characters.');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(fullName.trim(), email.trim(), password, role);
    } catch {
      // Error displayed via AuthContext's error state
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = validationError || error;

  return (
    <div style={styles.pageContainer}>
      {/* Decorative background orbs */}
      <div style={styles.glowOrb1} />
      <div style={styles.glowOrb2} />

      <div className="glass-card animate-scale-up" style={styles.card}>
        {/* Header */}
        <div style={styles.headerArea}>
          <div style={styles.logoBadge}>
            <CheckCircle size={28} color="#6366f1" />
          </div>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Join the ATS Review Panel</p>
        </div>

        {/* Error banner */}
        {activeError && (
          <div style={styles.errorBanner} className="animate-fade-in">
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{activeError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                id="fullName"
                type="text"
                className="form-control"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setValidationError(null); }}
                disabled={isSubmitting}
                style={{ paddingLeft: '44px' }}
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setValidationError(null); }}
                disabled={isSubmitting}
                style={{ paddingLeft: '44px' }}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Role */}
          <div className="form-group">
            <label className="form-label" htmlFor="role">Role</label>
            <div style={styles.inputWrapper}>
              <Briefcase size={18} style={styles.inputIcon} />
              <select
                id="role"
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isSubmitting}
                style={{ paddingLeft: '44px', cursor: 'pointer' }}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={styles.inputWrapper}>
              <KeyRound size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setValidationError(null); }}
                disabled={isSubmitting}
                style={{ paddingLeft: '44px' }}
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <div style={styles.inputWrapper}>
              <KeyRound size={18} style={styles.inputIcon} />
              <input
                id="confirmPassword"
                type="password"
                className="form-control"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setValidationError(null); }}
                disabled={isSubmitting}
                style={{ paddingLeft: '44px' }}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', paddingTop: '14px', paddingBottom: '14px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Navigate to login */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Already have an account?</span>
          <button
            type="button"
            onClick={onNavigateToLogin}
            disabled={isSubmitting}
            style={styles.linkButton}
          >
            <ArrowLeft size={14} style={{ marginRight: '4px' }} />
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    position: 'relative',
    padding: '20px',
    backgroundColor: 'var(--bg-main)',
  },
  glowOrb1: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
    top: '20%',
    left: '35%',
    filter: 'blur(50px)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  glowOrb2: {
    position: 'absolute',
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
    bottom: '20%',
    right: '35%',
    filter: 'blur(45px)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px 32px',
    zIndex: 1,
    border: '1px solid var(--border-glass)',
    backgroundColor: 'var(--bg-card-glass)',
  },
  headerArea: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '56px',
    height: '56px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: 'var(--text-title)',
    marginBottom: '6px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--accent-rose-glow)',
    border: '1px solid var(--accent-rose)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 16px',
    color: 'var(--accent-rose)',
    fontSize: '0.88rem',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '24px',
  },
  footerText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  linkButton: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    padding: '0',
    cursor: 'pointer',
    color: 'var(--accent-indigo)',
    fontSize: '0.85rem',
    fontWeight: '600',
    fontFamily: 'inherit',
    transition: 'var(--transition-fast)',
  },
};
