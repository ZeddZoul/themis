import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
  action?: ToastAction;
  onDismiss?: () => void;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Dismiss a toast by ID
   * Note: No dependencies needed as it uses functional state update
   */
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find(t => t.id === id);
      if (toast?.onDismiss) {
        toast.onDismiss();
      }
      return prev.filter((toast) => toast.id !== id);
    });
  }, []);

  /**
   * Show a new toast notification
   * Dependencies: [dismissToast] - Required for auto-dismiss timeout
   * Note: Uses functional state update to avoid stale closure issues
   */
  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration (default 3 seconds for success, 5 seconds for error)
    const duration = toast.duration ?? (toast.type === 'success' ? 3000 : 5000);
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
