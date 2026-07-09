import React from 'react';
import { AuthProvider, useAuth } from './presentation/contexts/AuthContext';
import { CVProvider } from './presentation/contexts/CVContext';
import { ToastProvider } from './presentation/contexts/ToastContext';
import { LoginPage } from './presentation/pages/LoginPage';
import { DashboardPage } from './presentation/pages/DashboardPage';
import { Loader2 } from 'lucide-react';
import './presentation/styles/index.css';

/**
 * Helper component that handles page routing based on the global authentication state.
 */
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  // Show a full-screen loading spinner while verifying active sessions (localStorage check)
  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinnerWrapper}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--accent-indigo)' }} />
          <p style={styles.loadingText}>Initializing ATS Platform...</p>
        </div>
      </div>
    );
  }

  if (user) return <DashboardPage />;

  return <LoginPage />;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CVProvider>
          <AppContent />
        </CVProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

// Layout styling for authentication check state
const styles: Record<string, React.CSSProperties> = {
  loadingScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-main)',
    fontFamily: 'var(--font-sans)',
  },
  spinnerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: 'var(--text-body)',
    letterSpacing: '0.02em',
  },
};
