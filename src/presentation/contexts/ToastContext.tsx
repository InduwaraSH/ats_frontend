import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let _nextId = 0;
const DURATION_MS = 4000;

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, DURATION_MS);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ── Toast container (fixed, top-right) ── */}
      <div style={containerStyle}>
        {toasts.map(toast => (
          <ToastBubble key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ─── Individual toast bubble ──────────────────────────────────────────────────

const CONFIGS = {
  success: {
    Icon: CheckCircle,
    color: 'var(--accent-emerald)',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.35)',
  },
  error: {
    Icon: AlertTriangle,
    color: 'var(--accent-rose)',
    bg: 'rgba(244, 63, 94, 0.08)',
    border: 'rgba(244, 63, 94, 0.35)',
  },
  info: {
    Icon: Info,
    color: 'var(--accent-indigo)',
    bg: 'rgba(99, 102, 241, 0.08)',
    border: 'rgba(99, 102, 241, 0.35)',
  },
} as const;

const ToastBubble: React.FC<{ toast: ToastItem; onDismiss: (id: number) => void }> = ({
  toast,
  onDismiss,
}) => {
  const { Icon, color, bg, border } = CONFIGS[toast.type];

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        boxShadow: 'var(--shadow-premium)',
        minWidth: '260px',
        maxWidth: '380px',
        pointerEvents: 'auto',
      }}
    >
      <Icon size={18} style={{ color, flexShrink: 0 }} />
      <span style={{ color: 'var(--text-body)', fontSize: '0.88rem', flex: 1, lineHeight: 1.4 }}>
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: '24px',
  right: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  zIndex: 9999,
  pointerEvents: 'none', // container transparent to clicks; bubbles opt-in above
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
