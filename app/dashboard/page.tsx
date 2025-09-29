import { createClient as createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import UploadWidget from "./upload-widget";

async function getData() {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const email = auth.user?.email ?? "";
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, original_name, status, score, created_at")
    .order("created_at", { ascending: false });
  return { email, submissions: submissions ?? [] };
}

export default async function DashboardPage() {
  const { email, submissions } = await getData();
  
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    needsRevision: submissions.filter(s => s.status === 'needs_revision').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };
  
  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back{email ? `, ${email}` : ""}. Manage your resume submissions.</p>
        </div>
      </div>

      {/* Stats Cards */}
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
      </div>

      <div className="card">
        <h2 className="text-xl mb-4">Upload New Resume</h2>
        <UploadWidget />
      </div>

      <div className="mt-8">
        <h2 className="section-title text-left mb-4">Your Submissions</h2>
        <div className="grid gap-4">
          {submissions.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-muted text-lg mb-4">No submissions yet.</p>
              <p className="text-muted">Upload your first resume to get started with the review process.</p>
            </div>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="card submission-card">
                <div className="submission-meta">
                  <div className="submission-info">
                    <h4>{s.original_name}</h4>
                    <div className="meta-text">
                      Submitted: {new Date(s.created_at).toLocaleDateString()}
                      {s.score != null && ` • Score: ${s.score}`}
                    </div>
                  </div>
                  <div className="submission-status">
                    <span className={`status-badge status-${s.status}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link className="btn" href={`/api/submissions?id=${s.id}`}>View Details</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// moved to client component for preview + toasts


