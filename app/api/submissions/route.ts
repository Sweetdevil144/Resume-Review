import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/admin";
import { ensureProfile } from "@/lib/ensureProfile";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureProfile(supabase);
  const { data, error } = await supabase
    .from("submissions")
    .select("id, original_name, status, score, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ submissions: data });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file_required" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "file_too_large" }, { status: 400 });

  const service = getSupabaseServiceClient();
  const ext = ".pdf";
  const objectKey = `resumes/${userId}/${crypto.randomUUID()}${ext}`;

  const { error: uploadErr } = await service.storage
    .from("resumes")
    .upload(objectKey, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 400 });

  const { data: signed } = await service.storage
    .from("resumes")
    .createSignedUrl(objectKey, 60 * 60 * 24 * 7); // 7 days

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      user_id: userId,
      file_url: signed?.signedUrl ?? objectKey,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}


