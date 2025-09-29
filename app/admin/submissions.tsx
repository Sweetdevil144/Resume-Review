"use client";
import Error from "next/error";
import { useEffect, useMemo, useState } from "react";

type Profile = {
  email?: string | null;
  full_name?: string | null;
} | null;

type Submission = {
  id: string;
  user_id: string;
  original_name: string | null;
  file_url?: string | null;
  status: "pending" | "approved" | "needs_revision" | "rejected";
  score: number | null;
  admin_notes: string | null;
  created_at: string;
  profiles?: Profile;
};

export default function AdminSubmissionsClient() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/submissions", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `Failed to load submissions (${res.status})`,
        );
      }
      const body = (await res.json()) as { submissions: Submission[] };
      setSubmissions(body.submissions || []);
    } catch (e: any) {
      setError(e.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: submissions.length,
      pending: submissions.filter((s) => s.status === "pending").length,
      approved: submissions.filter((s) => s.status === "approved").length,
      needsRevision: submissions.filter((s) => s.status === "needs_revision")
        .length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    };
  }, [submissions]);

  async function updateSubmission(id: string, payload: Partial<Submission>) {
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to update (${res.status})`);
    }
  }

  return (
    <div>
      {/* Admin Stats */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.needsRevision}</div>
          <div className="stat-label">Needs Revision</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <h2 className="section-title text-left mb-4">Recent Submissions</h2>

      {loading && (
        <div className="card">
          <div className="text-sm">Loading submissions...</div>
        </div>
      )}
      {error && (
        <div className="card">
          <div className="text-sm" style={{ color: "#ef4444" }}>
            {error}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {!loading &&
          !error &&
          submissions.map((s) => (
            <div key={s.id} className="card submission-card">
              <div className="submission-meta">
                <div className="submission-info">
                  <h4>{s.original_name}</h4>
                  <div className="meta-text">
                    By:{" "}
                    {s.profiles?.full_name ||
                      s.profiles?.email ||
                      "Unknown User"}
                  </div>
                  <div className="meta-text">
                    Submitted: {new Date(s.created_at).toLocaleDateString()}
                    {s.score != null && ` • Current Score: ${s.score}`}
                  </div>
                </div>
                <div className="submission-status">
                  <span className={`status-badge status-${s.status}`}>
                    {s.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="form-actions" style={{ marginBottom: "0.75rem" }}>
                {s.file_url && (
                  <a
                    className="btn"
                    href={s.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View PDF
                  </a>
                )}
              </div>

              <div className="form-grid">
                <div className="field">
                  <label className="text-sm text-muted mb-1">Status</label>
                  <select
                    className="input"
                    defaultValue={s.status}
                    onChange={async (e) => {
                      const value = e.target.value as Submission["status"];
                      try {
                        await updateSubmission(s.id, { status: value });
                        setSubmissions((prev) =>
                          prev.map((x) =>
                            x.id === s.id ? { ...x, status: value } : x,
                          ),
                        );
                      } catch (err) {
                        // no toast infra here; keep minimal
                      }
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="needs_revision">Needs Revision</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="field">
                  <label className="text-sm text-muted mb-1">
                    Score (0-100)
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    defaultValue={s.score ?? ""}
                    onBlur={async (e) => {
                      const raw = e.target.value;
                      const num = raw === "" ? null : Number(raw);
                      try {
                        await updateSubmission(s.id, { score: num as any });
                        setSubmissions((prev) =>
                          prev.map((x) =>
                            x.id === s.id ? { ...x, score: num } : x,
                          ),
                        );
                      } catch {}
                    }}
                  />
                </div>
                <div className="field">
                  <label className="text-sm text-muted mb-1">Admin Notes</label>
                  <input
                    className="input"
                    defaultValue={s.admin_notes ?? ""}
                    placeholder="Add feedback notes..."
                    onBlur={async (e) => {
                      const val = e.target.value;
                      try {
                        await updateSubmission(s.id, {
                          admin_notes: val as any,
                        });
                        setSubmissions((prev) =>
                          prev.map((x) =>
                            x.id === s.id ? { ...x, admin_notes: val } : x,
                          ),
                        );
                      } catch {}
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="form-actions" style={{ marginTop: "1rem" }}>
        <button className="btn" onClick={load}>
          Refresh
        </button>
      </div>
    </div>
  );
}
