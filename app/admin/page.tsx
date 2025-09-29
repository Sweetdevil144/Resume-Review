import { createClient as createServerSupabase } from "@/lib/supabase/server";
import AdminSubmissionsClient from "./submissions";

export default async function AdminPage() {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", userId)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="container">
        <h1 className="text-xl mb-2">Admin</h1>
        <p>Access denied.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Admin Panel</h1>
          <p className="dashboard-subtitle">
            Welcome, {profile?.full_name ?? profile?.email ?? "Admin"}. Manage
            all resume submissions.
          </p>
        </div>
      </div>

      <AdminSubmissionsClient />
    </div>
  );
}
