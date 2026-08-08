import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkUsage, recordUsage } from "@/lib/usage";

const ANON_COOKIE = "Plethora_anon_id";

function getOrCreateAnonymousId(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  let id = cookieStore.get(ANON_COOKIE)?.value;
  if (!id) {
    id = crypto.randomUUID();
  }
  return id;
}

export async function POST(request: Request) {
  const body = await request.json();
  const toolId = body.toolId?.trim();

  if (!toolId) {
    return NextResponse.json({ error: "toolId is required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const anonymousId = getOrCreateAnonymousId(cookieStore);

  const usage = await checkUsage(toolId, anonymousId);

  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: "Daily limit reached",
        current: usage.current,
        limit: usage.limit,
        plan: usage.plan,
        upgradeUrl: "/pricing",
      },
      { status: 429 }
    );
  }

  const count = await recordUsage(toolId, anonymousId, body.metadata);

  const response = NextResponse.json({
    success: true,
    count,
    limit: usage.limit,
    plan: usage.plan,
  });

  if (!cookieStore.get(ANON_COOKIE)?.value) {
    response.cookies.set(ANON_COOKIE, anonymousId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const toolId = searchParams.get("toolId");

  if (!toolId) {
    return NextResponse.json({ error: "toolId is required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const anonymousId = cookieStore.get(ANON_COOKIE)?.value;
  const usage = await checkUsage(toolId, anonymousId);

  return NextResponse.json(usage);
}
