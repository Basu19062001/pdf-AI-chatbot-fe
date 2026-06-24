import { useCallback, useMemo, useRef, useState } from 'react';

import { ToastContext } from './toast-context';

const DEFAULT_DURATION = 3600;

export function ToastProvider({ children }) {
  const nextIdRef = useRef(1);
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ title, message = '', tone = 'neutral', duration = DEFAULT_DURATION }) => {
      const id = nextIdRef.current++;

      setToasts((current) => [
        ...current,
        {
          id,
          title,
          message,
          tone,
        },
      ]);

      if (duration > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      toasts,
      pushToast,
      dismissToast,
    }),
    [dismissToast, pushToast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <article key={toast.id} className={`toast toast--${toast.tone}`}>
            <div className="toast__body">
              <strong>{toast.title}</strong>
              {toast.message ? <p>{toast.message}</p> : null}
            </div>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              x
            </button>
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
