import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/ensureProfile";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  const supabase = await createServerSupabase();
  const sp = await searchParams;
  if (sp?.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(sp.code);
    if (!error) {
      await ensureProfile(supabase);

      // Check user role to determine redirect destination
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      const defaultRoute = profile?.role === "admin" ? "/admin" : "/dashboard";
      const nextPath =
        typeof sp.next === "string" && sp.next.startsWith("/")
          ? (sp.next as Route)
          : (defaultRoute as Route);
      redirect(nextPath);
    }
  }

  const { data } = await supabase.auth.getUser();
  const isAuthed = Boolean(data.user);

  let userRole = null;
  if (isAuthed) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user?.id)
      .maybeSingle();
    userRole = profile?.role;
  }

  return (
    <div className="container">
      <div className="hero-section">
        <h1 className="hero-title">Resume Review Platform</h1>
        <p className="hero-subtitle">
          Streamline your resume review process with our professional platform
        </p>
        <div className="grid gap-3 mt-6">
          {isAuthed ? (
            <>
              {userRole === "user" && (
                <Link className="btn btn-primary" href="/dashboard">
                  Go to Dashboard
                </Link>
              )}
              {userRole === "admin" && (
                <Link className="btn btn-primary" href="/admin">
                  Go to Admin Panel
                </Link>
              )}
            </>
          ) : (
            <Link className="btn btn-primary" href="/login">
              Get Started
            </Link>
          )}
        </div>
      </div>

      {!isAuthed && (
        <div className="features-section">
          <h2 className="section-title">Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Easy Upload</h3>
              <p>Upload your resume in PDF format with instant preview</p>
            </div>
            <div className="feature-card">
              <h3>Track Progress</h3>
              <p>Monitor your submission status and get detailed feedback</p>
            </div>
            <div className="feature-card">
              <h3>Professional Review</h3>
              <p>Get expert feedback and scoring on your resume</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
