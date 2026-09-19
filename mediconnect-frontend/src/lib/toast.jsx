import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const lastPushRef = useRef({ key: null, time: 0 });

  const push = useCallback((message, type = "info", duration = 4000) => {
    if (!message) return;
    const key = `${type}|${message}`;
    const now = Date.now();
    if (lastPushRef.current.key === key && now - lastPushRef.current.time < 2000) {
      return;
    }
    lastPushRef.current = { key, time: now };

    setToasts((prev) => {

      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      const id = ++idRef.current;

      const trimmed = prev.length >= 3 ? prev.slice(prev.length - 2) : prev;
      window.setTimeout(() => {
        setToasts((curr) => curr.filter((x) => x.id !== id));
      }, duration);
      return [...trimmed, { id, message, type }];
    });
  }, []);

  const value = useMemo(
    () => ({
      success: (m) => push(m, "success"),
      error: (m) => push(m, "error"),
      info: (m) => push(m, "info"),
      warning: (m) => push(m, "warning"),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
