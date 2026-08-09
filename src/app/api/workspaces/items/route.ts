import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const workspaceId = new URL(req.url).searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("workspace_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message, items: [] }, { status: 503 });
  }
  return NextResponse.json({ items: data || [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: {
    workspaceId?: string;
    kind?: string;
    title?: string;
    body?: string;
    toolSlug?: string;
    data?: Record<string, unknown>;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const kind = body.kind || "note";
  const { data, error } = await supabase
    .from("workspace_items")
    .insert({
      workspace_id: body.workspaceId,
      user_id: user.id,
      kind,
      title: body.title?.slice(0, 120) || null,
      body: body.body?.slice(0, 20000) || null,
      tool_slug: body.toolSlug || null,
      data: body.data || {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await supabase.from("workspace_items").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
