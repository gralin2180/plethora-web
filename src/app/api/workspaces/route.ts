import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanCapabilities, parsePlanId } from "@/lib/plans";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  // try ensure default
  try {
    await supabase.rpc("ensure_default_workspace", { p_user_id: user.id });
  } catch {
    /* schema may be missing */
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", user.id)
    .single();
  const plan = parsePlanId(profile?.subscription_plan);
  const max = getPlanCapabilities(plan).maxWorkspaces;

  const { data: workspaces, error } = await supabase
    .from("workspaces")
    .select("id, name, description, is_default, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        code: "schema",
        hint: "Run supabase/workspaces_devices.sql in Supabase SQL Editor.",
        workspaces: [],
        limit: max,
        plan,
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    workspaces: workspaces || [],
    limit: max,
    plan,
    count: workspaces?.length ?? 0,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { name?: string; description?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", user.id)
    .single();
  const plan = parsePlanId(profile?.subscription_plan);
  const max = getPlanCapabilities(plan).maxWorkspaces;

  const { count } = await supabase
    .from("workspaces")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= max) {
    return NextResponse.json(
      {
        error: `Workspace limit (${max}) on ${plan}. Upgrade for more.`,
        code: "workspace_limit",
      },
      { status: 403 }
    );
  }

  const name = (body.name || "New workspace").slice(0, 80);
  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      user_id: user.id,
      name,
      description: body.description?.slice(0, 500) || null,
      is_default: false,
    })
    .select("id, name, description, is_default, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, code: "schema" }, { status: 503 });
  }
  return NextResponse.json({ workspace: data });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { id?: string; name?: string; description?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, string> = {};
  if (body.name) patch.name = body.name.slice(0, 80);
  if (body.description !== undefined) patch.description = body.description.slice(0, 500);

  const { data, error } = await supabase
    .from("workspaces")
    .update(patch)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ workspace: data });
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

  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_default", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
