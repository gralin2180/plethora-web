/**
 * Org infra control — remote desktops + AI scale.
 * Plethora does not become Parsec or RustDesk. We inventory hosts, ship
 * self-host recipes, and let an admin set AI to capped / full / custom via env.
 */

export type AiScaleMode = "capped" | "full" | "custom";

export type OrgAiPolicy = {
  scale: AiScaleMode;
  /** Used when scale === custom */
  freeDaily: number;
  premiumMonth: number;
};

export type RemoteKind = "parsec" | "rustdesk" | "ssh" | "rdp";

export type RemoteHost = {
  id: string;
  name: string;
  kind: RemoteKind;
  /** Parsec peer / RustDesk ID / host:port */
  address: string;
  notes: string;
};

export const DEFAULT_ORG_AI_POLICY: OrgAiPolicy = {
  scale: "capped",
  freeDaily: 40,
  premiumMonth: 0,
};

export function readOrgAiPolicyFromEnv(): OrgAiPolicy {
  const raw = (process.env.PLETHORA_ORG_AI_SCALE || "capped").toLowerCase();
  const scale: AiScaleMode =
    raw === "full" || raw === "custom" || raw === "capped" ? raw : "capped";
  const freeDaily = Number(process.env.PLETHORA_ORG_FREE_DAILY);
  const premiumMonth = Number(process.env.PLETHORA_ORG_PREMIUM_MONTH);
  return {
    scale,
    freeDaily: Number.isFinite(freeDaily) && freeDaily > 0 ? freeDaily : DEFAULT_ORG_AI_POLICY.freeDaily,
    premiumMonth: Number.isFinite(premiumMonth) && premiumMonth >= 0 ? premiumMonth : 0,
  };
}

/** Admin full-scale: skip per-user free/premium caps (not CSAM / safety). */
export function orgAiIsFullScale(policy: OrgAiPolicy = readOrgAiPolicyFromEnv()): boolean {
  return policy.scale === "full";
}

/** Overlay custom org quotas onto a resolved entitlement. Full scale is handled separately. */
export function applyOrgAiToEntitlement<T extends {
  freeDailyLimit: number;
  premiumLimit: number;
  premiumEffectiveLimit: number;
  premiumAllowed: boolean;
  routeLabel: string;
}>(ent: T, policy: OrgAiPolicy = readOrgAiPolicyFromEnv()): T {
  if (policy.scale !== "custom") return ent;
  return {
    ...ent,
    freeDailyLimit: policy.freeDaily,
    premiumLimit: Math.max(ent.premiumLimit, policy.premiumMonth),
    premiumEffectiveLimit: Math.max(ent.premiumEffectiveLimit, policy.premiumMonth),
    premiumAllowed: ent.premiumAllowed || policy.premiumMonth > 0,
    routeLabel: `org custom · ${policy.freeDaily}/day free`,
  };
}

export const RUSTDESK_COMPOSE = `services:
  hbbs:
    image: rustdesk/rustdesk-server:latest
    command: hbbs -r rustdesk.example.com:21117
    ports:
      - "21115:21115"
      - "21116:21116"
      - "21116:21116/udp"
      - "21118:21118"
    volumes:
      - rustdesk-data:/root
    restart: unless-stopped
  hbbr:
    image: rustdesk/rustdesk-server:latest
    command: hbbr
    ports:
      - "21117:21117"
      - "21119:21119"
    volumes:
      - rustdesk-data:/root
    restart: unless-stopped
volumes:
  rustdesk-data:`;

export const PARSEC_NOTES = `Parsec (low-latency desktop — their client, not ours)
1. Install Parsec on the GPU / edit box and on the operator machine (parsec.app/downloads).
2. Host: enable hosting, note the computer name. Add it in the inventory below.
3. Guest: connect through Parsec. We do not proxy their relay.
4. Use for game capture, Unreal/Godot, Premiere, and live GPU work.
5. Pair with Local backends once Ollama is up on that host.`;

export const GPU_WORKER_NOTES = `GPU worker (full-scale local AI)
1. Machine with NVIDIA (or Apple Silicon) on the LAN or over RustDesk/Parsec.
2. Ollama or vLLM listening on a private bind (not 0.0.0.0 to the internet).
3. Plethora Local backends → that URL (ssh tunnel or WireGuard if remote).
4. Set PLETHORA_ORG_AI_SCALE=full on Vercel only if the org pays the GPU/API bill.
5. BYOK / connected ChatGPT still bypasses our pool.`;

export const INFRA_ENV_HELP = [
  {
    key: "PLETHORA_ORG_AI_SCALE",
    meaning: "capped (default) | full (signed-in users, no per-user cap; guests stay capped) | custom",
  },
  {
    key: "PLETHORA_ORG_FREE_DAILY",
    meaning: "When custom: platform free-model messages per user per day",
  },
  {
    key: "PLETHORA_ORG_PREMIUM_MONTH",
    meaning: "When custom: included paid-model messages per user per month",
  },
  {
    key: "PLETHORA_DEV_EMAILS",
    meaning: "Admins who can save policy from /infra (also owner unrestricted)",
  },
];
