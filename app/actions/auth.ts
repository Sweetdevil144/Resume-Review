"use server";
import { redirect } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export async function logoutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
