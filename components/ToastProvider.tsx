"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type Toast = {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
};

type ToastContextType = {
  show: (message: string, type?: Toast["type"]) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type?: Toast["type"]) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          display: "grid",
          gap: 8,
          zIndex: 50,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card"
            style={{ minWidth: 260, borderColor: colorFor(t.type) }}
          >
            <div
              className="text-sm"
              style={{ color: colorFor(t.type), fontWeight: 600 }}
            >
              {labelFor(t.type)}
            </div>
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function colorFor(type?: Toast["type"]) {
  if (type === "success") return "#065f46";
  if (type === "error") return "#991b1b";
  return "#1f2937";
}

function labelFor(type?: Toast["type"]) {
  if (type === "success") return "Success";
  if (type === "error") return "Error";
  return "Info";
}
