"use client";
import { useEffect, useRef } from "react";

export default function PdfPreview({ file }: { file: File | null }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const iframe = iframeRef.current;
    if (iframe) iframe.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file) return null;
  return (
    <div className="card" style={{ height: 400 }}>
      <iframe
        ref={iframeRef}
        title="PDF Preview"
        style={{ width: "100%", height: "100%", border: 0 }}
      />
    </div>
  );
}
