import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanCapabilities, type PlanId } from "@/lib/plans";

/**
 * Register / heartbeat current browser as a device seat.
 * Body: { deviceKey, label?, revokeDeviceId? }
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required", code: "auth" }, { status: 401 });
  }

  let body: { deviceKey?: string; label?: string; revokeDeviceId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.revokeDeviceId) {
    await supabase
      .from("user_devices")
      .delete()
      .eq("id", body.revokeDeviceId)
      .eq("user_id", user.id);
  }

  const deviceKey = (body.deviceKey || "").trim();
  if (!deviceKey || deviceKey.length > 128) {
    return NextResponse.json({ error: "deviceKey required" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", user.id)
    .single();

  const plan = (profile?.subscription_plan as PlanId) || "free";
  const caps = getPlanCapabilities(plan);
  const max = caps.maxDevices;

  const { data: existing } = await supabase
    .from("user_devices")
    .select("id, device_key, label, last_seen_at, created_at")
    .eq("user_id", user.id)
    .order("last_seen_at", { ascending: false });

  const list = existing || [];
  const mine = list.find((d) => d.device_key === deviceKey);

  if (mine) {
    await supabase
      .from("user_devices")
      .update({
        last_seen_at: new Date().toISOString(),
        label: body.label || mine.label,
        user_agent: req.headers.get("user-agent")?.slice(0, 300) || null,
      })
      .eq("id", mine.id);

    return NextResponse.json({
      ok: true,
      registered: true,
      limit: max,
      plan,
      count: list.length,
      devices: list,
      thisDeviceId: mine.id,
    });
  }

  if (list.length >= max) {
    return NextResponse.json(
      {
        ok: false,
        code: "device_limit",
        error: `Device limit reached (${max} on ${caps.name}). Remove an old device or upgrade.`,
        limit: max,
        plan,
        count: list.length,
        devices: list,
      },
      { status: 403 }
    );
  }

  const { data: inserted, error } = await supabase
    .from("user_devices")
    .insert({
      user_id: user.id,
      device_key: deviceKey,
      label: body.label || "Browser",
      user_agent: req.headers.get("user-agent")?.slice(0, 300) || null,
    })
    .select("id, device_key, label, last_seen_at, created_at")
    .single();

  if (error) {
    // race unique key — treat as success update
    if (error.code === "23505") {
      await supabase
        .from("user_devices")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("device_key", deviceKey);
      return NextResponse.json({ ok: true, registered: true, limit: max, plan });
    }
    // table missing
    return NextResponse.json(
      {
        ok: false,
        code: "schema",
        error:
          "Device tables missing. Run supabase/workspaces_devices.sql in the SQL editor.",
        detail: error.message,
      },
      { status: 503 }
    );
  }

  const { data: after } = await supabase
    .from("user_devices")
    .select("id, device_key, label, last_seen_at, created_at")
    .eq("user_id", user.id)
    .order("last_seen_at", { ascending: false });

  return NextResponse.json({
    ok: true,
    registered: true,
    limit: max,
    plan,
    count: (after || []).length,
    devices: after || [],
    thisDeviceId: inserted?.id,
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan")
    .eq("id", user.id)
    .single();
  const plan = (profile?.subscription_plan as PlanId) || "free";
  const max = getPlanCapabilities(plan).maxDevices;

  const { data: devices, error } = await supabase
    .from("user_devices")
    .select("id, device_key, label, last_seen_at, created_at")
    .eq("user_id", user.id)
    .order("last_seen_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: "schema", limit: max, plan, devices: [] },
      { status: 503 }
    );
  }

  return NextResponse.json({
    limit: max,
    plan,
    count: devices?.length ?? 0,
    devices: devices || [],
  });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await supabase.from("user_devices").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
