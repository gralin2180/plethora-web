import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ signedIn: false, chat: [], tools: [], api: [] });
  }

  let chat: { role: string; content: string; created?: string }[] = [];
  try {
    const { data } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40);
    chat = (data || []).map((r) => ({
      role: String(r.role),
      content: String(r.content || "").slice(0, 280),
      created: r.created_at as string,
    }));
  } catch {
    /* table optional */
  }

  let tools: { tool_id: string; run_count: number; usage_date?: string }[] = [];
  try {
    const { data } = await supabase
      .from("usage_daily")
      .select("tool_id, run_count, usage_date")
      .eq("user_id", user.id)
      .order("usage_date", { ascending: false })
      .limit(60);
    tools = (data || []) as typeof tools;
  } catch {
    /* */
  }

  let api: { tool_id?: string; created_at?: string; metadata?: unknown }[] = [];
  try {
    const { data } = await supabase
      .from("tool_runs")
      .select("tool_id, created_at, metadata")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40);
    api = data || [];
  } catch {
    /* */
  }

  return NextResponse.json({ signedIn: true, chat, tools, api });
}
