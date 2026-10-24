import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type ToastKind = 'ok' | 'err';
interface ToastState {
  message: string;
  kind: ToastKind;
  key: number;
}

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | null>(null);

  const show = useCallback((message: string, kind: ToastKind = 'ok') => {
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ message, kind, key: Date.now() });
    timer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="sr-only" aria-live="polite" role="status">
        {toast?.message ?? ''}
      </div>
      {toast ? (
        <div className="toast" data-kind={toast.kind} onClick={() => setToast(null)}>
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): (message: string, kind?: ToastKind) => void {
  return useContext(ToastContext);
}
