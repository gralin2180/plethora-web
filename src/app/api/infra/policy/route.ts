import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { emailsFromAuthUser, isDevUnrestricted } from "@/lib/dev-access";
import {
  DEFAULT_ORG_AI_POLICY,
  readOrgAiPolicyFromEnv,
  type AiScaleMode,
  type OrgAiPolicy,
} from "@/lib/infra-control";

const COOKIE = "plethora.infra.policy.v1";

function parsePolicy(raw: string | undefined): OrgAiPolicy {
  if (!raw) return readOrgAiPolicyFromEnv();
  try {
    const p = JSON.parse(raw) as OrgAiPolicy;
    const scale: AiScaleMode =
      p.scale === "full" || p.scale === "custom" || p.scale === "capped" ? p.scale : "capped";
    return {
      scale,
      freeDaily: Math.max(1, Number(p.freeDaily) || DEFAULT_ORG_AI_POLICY.freeDaily),
      premiumMonth: Math.max(0, Number(p.premiumMonth) || 0),
    };
  } catch {
    return readOrgAiPolicyFromEnv();
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = isDevUnrestricted({
    email: user?.email,
    userId: user?.id,
    emails: emailsFromAuthUser(user),
  });
  const store = await cookies();
  const cookiePolicy = admin ? parsePolicy(store.get(COOKIE)?.value) : readOrgAiPolicyFromEnv();
  const env = readOrgAiPolicyFromEnv();
  return NextResponse.json({
    admin,
    policy: cookiePolicy,
    env,
    note: "Org-wide full scale is PLETHORA_ORG_AI_SCALE on the server. Cookie is an admin overlay for this browser.",
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = isDevUnrestricted({
    email: user?.email,
    userId: user?.id,
    emails: emailsFromAuthUser(user),
  });
  if (!admin) {
    return NextResponse.json(
      { error: "Only an org admin (PLETHORA_DEV_EMAILS / owner) can change AI scale." },
      { status: 403 }
    );
  }
  const body = (await req.json().catch(() => ({}))) as Partial<OrgAiPolicy>;
  const scale: AiScaleMode =
    body.scale === "full" || body.scale === "custom" || body.scale === "capped"
      ? body.scale
      : "capped";
  const policy: OrgAiPolicy = {
    scale,
    freeDaily: Math.max(1, Number(body.freeDaily) || 40),
    premiumMonth: Math.max(0, Number(body.premiumMonth) || 0),
  };
  const res = NextResponse.json({ ok: true, policy, envHint: "Set PLETHORA_ORG_AI_SCALE on Vercel for every user." });
  res.cookies.set(COOKIE, JSON.stringify(policy), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
