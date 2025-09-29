"use client";
import { useState } from "react";
import PdfPreview from "@/components/PdfPreview";
import { useToast } from "@/components/ToastProvider";

export default function UploadWidget() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const { show } = useToast();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return setFile(null);
    if (f.type !== "application/pdf") {
      show("Only PDF files are allowed", "error");
      e.currentTarget.value = "";
      return setFile(null);
    }
    if (f.size > 10 * 1024 * 1024) {
      show("File too large (max 10MB)", "error");
      e.currentTarget.value = "";
      return setFile(null);
    }
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return show("Select a PDF first", "error");
    setBusy(true);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/submissions", { method: "POST", body });
    setBusy(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Upload failed" }));
      show(error ?? "Upload failed", "error");
      return;
    }
    show("Uploaded successfully", "success");
    window.location.reload();
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="card">
        <div className="field">
          <label>Upload PDF</label>
          <input className="input" type="file" accept="application/pdf" onChange={onFileChange} />
        </div>
      </div>
      <PdfPreview file={file} />
      <div>
        <button className="btn" disabled={busy} type="submit">{busy ? "Uploading..." : "Submit"}</button>
      </div>
    </form>
  );
}


