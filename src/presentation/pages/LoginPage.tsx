import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, Mail, AlertTriangle, Loader2 } from 'lucide-react';

// TODO: Remove this flag (and the credentials banner) before production release.
const DEV_MODE = true;

interface LoginPageProps {
  onNavigateToSignup: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToSignup }) => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handles form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    // Local validation
    if (!email.trim() || !password.trim()) {
      setValidationError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      // Error is caught by AuthContext, so we just capture completion here
      console.log('Login attempt failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* Decorative Background Orbs */}
      <div style={styles.glowOrb1} />
      <div style={styles.glowOrb2} />

      <div className="glass-card animate-scale-up" style={styles.loginCard}>
        <div style={styles.headerArea}>
          <div style={styles.logoBadge}>
            <KeyRound size={28} color="#6366f1" />
          </div>
          <h2 style={styles.title}>ATS Review Panel</h2>
          <p style={styles.subtitle}>Enter credentials to evaluate resumes</p>
        </div>

        {/* Display validation or auth errors */}
        {(validationError || error) && (
          <div style={styles.errorBanner} className="animate-fade-in">
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isSubmitting}
                style={{ paddingLeft: '44px' }}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={styles.inputWrapper}>
              <KeyRound size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isSubmitting}
                style={{ paddingLeft: '44px' }}
                autoComplete="current-password"
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
                <Loader2 size={18} className="animate-spin" style={styles.spinner} />
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Navigate to Signup */}
        <div style={styles.footer}>
          <span style={styles.footerText}>Don't have an account?</span>
          <button
            type="button"
            onClick={onNavigateToSignup}
            disabled={isSubmitting}
            style={styles.linkButton}
          >
            Sign Up
          </button>
        </div>

        {/* DEV-ONLY: remove before going to production */}
        {DEV_MODE && (
          <div style={styles.devBanner}>
            <p style={styles.devTitle}>Dev Credentials</p>
            <code style={styles.devCode}>admin@ats.com</code>
            <code style={styles.devCode}>123456</code>
          </div>
        )}
      </div>
    </div>
  );
};

// Inline premium styles for login layout
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
    top: '25%',
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
    bottom: '30%',
    right: '35%',
    filter: 'blur(45px)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  loginCard: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px 32px',
    zIndex: 1,
    border: '1px solid var(--border-glass)',
    backgroundColor: 'var(--bg-card-glass)',
  },
  headerArea: {
    textAlign: 'center',
    marginBottom: '32px',
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
    marginBottom: '24px',
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
  spinner: {
    animation: 'spin 1s linear infinite',
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
  devBanner: {
    marginTop: '16px',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    border: '1px dashed rgba(245, 158, 11, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  devTitle: {
    fontSize: '0.72rem',
    fontWeight: '600',
    color: 'var(--accent-amber)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '2px',
  },
  devCode: {
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
  },
};
