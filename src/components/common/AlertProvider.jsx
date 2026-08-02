import React, { createContext, useContext, useState, useCallback } from 'react';

/* ── Types: success | error | info | warning ── */

const ToastContext = createContext(null);
const ConfirmContext = createContext(null);

const ICONS = {
  success: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  warning: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

const COLORS = {
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: 'text-emerald-500', bar: 'bg-emerald-500' },
  error:   { bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: 'text-red-500',     bar: 'bg-red-500'     },
  warning: { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   icon: 'text-amber-500',   bar: 'bg-amber-500'   },
  info:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    icon: 'text-blue-500',    bar: 'bg-blue-500'    },
};

/* ── Single Toast ── */
function Toast({ id, type = 'info', message, onClose }) {
  const c = COLORS[type] || COLORS.info;
  return (
    <div
      className={`group relative flex items-start gap-3 w-full max-w-sm rounded-2xl border px-4 py-4 shadow-2xl backdrop-blur-md overflow-hidden animate-slide-up ${c.bg} ${c.border}`}
      style={{ backgroundColor: 'var(--card-bg)' }}
    >
      {/* Colored left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${c.bar}`} />

      {/* Icon */}
      <span className={`shrink-0 mt-0.5 ${c.icon}`}>{ICONS[type]}</span>

      {/* Message */}
      <p className="flex-1 text-sm font-semibold leading-snug text-[color:var(--text-dark)] pr-6">{message}</p>

      {/* Close */}
      <button
        onClick={() => onClose(id)}
        className="absolute top-3 right-3 text-[color:var(--text-light)] hover:text-[color:var(--text-dark)] transition-colors"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ── Toast Container ── */
function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: '380px' }}>
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

/* ── Confirm Dialog ── */
function ConfirmDialog({ config, onConfirm, onCancel }) {
  if (!config) return null;
  const { title = 'Are you sure?', message, confirmText = 'Yes, Confirm', cancelText = 'Cancel', type = 'warning' } = config;
  const c = COLORS[type] || COLORS.warning;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        className={`relative w-full max-w-md rounded-2xl border p-8 shadow-2xl text-center animate-slide-up ${c.bg} ${c.border}`}
        style={{ backgroundColor: 'var(--card-bg)' }}
      >
        {/* Icon */}
        <div className={`w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center ${c.bg} ${c.icon} ring-8 ring-white/5`}>
          <span className="scale-125">{ICONS[type]}</span>
        </div>

        <h3 className="text-xl font-black mb-2 text-[color:var(--text-dark)]">{title}</h3>
        {message && <p className="text-sm text-[color:var(--text-light)] mb-8 leading-relaxed">{message}</p>}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-5 rounded-xl font-bold border text-[color:var(--text-light)] hover:bg-white/5 transition-all"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-5 rounded-xl font-black text-white transition-all hover:scale-[1.02] active:scale-95 ${
              type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/30' :
              type === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30' :
              'bg-gradient-to-r from-primary-500 to-indigo-500 shadow-lg shadow-primary-500/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Provider ── */
export function AlertProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [confirmResolve, setConfirmResolve] = useState(null);

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Returns a promise — resolves true (confirm) or false (cancel)
  const confirm = useCallback((config) => {
    return new Promise((resolve) => {
      setConfirmConfig(typeof config === 'string' ? { message: config } : config);
      setConfirmResolve(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    if (confirmResolve) confirmResolve(true);
    setConfirmConfig(null);
    setConfirmResolve(null);
  };

  const handleCancel = () => {
    if (confirmResolve) confirmResolve(false);
    setConfirmConfig(null);
    setConfirmResolve(null);
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <ConfirmDialog config={confirmConfig} onConfirm={handleConfirm} onCancel={handleCancel} />
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
export const useConfirm = () => useContext(ConfirmContext);
