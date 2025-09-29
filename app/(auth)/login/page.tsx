"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const envBase = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const runtimeBase = typeof window !== "undefined" ? window.location.origin : "";
    const base = (envBase || runtimeBase).replace(/\/$/, "");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${base}/auth/callback`,
      },
    });
    if (error) setMessage(error.message);
    else setMessage("Magic link sent. Check your email.");
    setLoading(false);
  }

  return (
    <div className="container">
      <div className="hero-section">
        <h1 className="hero-title">Welcome Back</h1>
        <p className="hero-subtitle">
          Enter your email to receive a secure login link
        </p>
      </div>

      <div className="card" style={{ maxWidth: "500px", margin: "0 auto" }}>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="field">
            <label className="text-sm text-muted mb-1">Email Address</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Sending Magic Link..." : "Send Magic Link"}
          </button>
        </form>
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes("sent")
                ? "bg-green-900/20 text-green-400 border border-green-400/20"
                : "bg-red-900/20 text-red-400 border border-red-400/20"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="text-sm text-muted">
            Don't have an account? The magic link will create one for you
            automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
