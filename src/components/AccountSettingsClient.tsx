"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  displayName,
  fileToAvatarDataUrl,
  loadCustomAvatar,
  oauthAvatarUrl,
  saveCustomAvatar,
} from "@/lib/user-avatar";
import {
  CreditCard,
  KeyRound,
  Loader2,
  Shield,
  Smartphone,
} from "lucide-react";

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "")
  );
}

const field =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none";
const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60";
const ghost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5 disabled:opacity-60";

export function AccountSettingsClient() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phonePending, setPhonePending] = useState(false);

  const [qr, setQr] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [factors, setFactors] = useState<{ id: string; status: string; friendly_name?: string }[]>(
    []
  );

  const [plan, setPlan] = useState<string>("free");
  const [routeLabel, setRouteLabel] = useState<string>("");
  const [stripeReady, setStripeReady] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  async function refreshUser() {
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    setUser(u);
    if (u) {
      setEmail(u.email || "");
      setPhone(u.phone || "");
      setAvatar(loadCustomAvatar(u.id) || oauthAvatarUrl(u));
    }
    const listed = await supabase.auth.mfa.listFactors();
    if (listed.data) {
      setFactors(
        [...listed.data.totp, ...listed.data.phone].map((f) => ({
          id: f.id,
          status: f.status,
          friendly_name: f.friendly_name || undefined,
        }))
      );
    }
  }

  useEffect(() => {
    (async () => {
      await refreshUser();
      try {
        const r = await fetch("/api/billing/status");
        const d = (await r.json()) as {
          signedIn?: boolean;
          stripeReady?: boolean;
          plan?: string;
          entitlement?: { routeLabel?: string; plan?: string };
        };
        if (!d.signedIn) {
          router.replace("/auth/login?next=/settings");
          return;
        }
        setStripeReady(Boolean(d.stripeReady));
        setPlan(d.entitlement?.plan || d.plan || "free");
        setRouteLabel(d.entitlement?.routeLabel || "");
      } catch {
        /* billing optional */
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flash(ok: string | null, error?: string | null) {
    setMsg(ok);
    setErr(error || null);
  }

  async function saveEmail() {
    if (!email.trim()) return;
    setBusy("email");
    flash(null);
    const { error } = await supabase.auth.updateUser(
      { email: email.trim() },
      { emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent("/settings")}` }
    );
    flash(
      error ? null : "Check both the old and new inbox to confirm the email change.",
      error?.message
    );
    setBusy(null);
  }

  async function sendPhone() {
    if (!phone.trim()) return;
    setBusy("phone");
    flash(null);
    const { error } = await supabase.auth.updateUser({ phone: phone.trim() });
    if (error) flash(null, error.message);
    else {
      setPhonePending(true);
      flash("We sent a code to that number. Enter it below.");
    }
    setBusy(null);
  }

  async function verifyPhone() {
    setBusy("phone-code");
    flash(null);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: phoneCode.trim(),
      type: "phone_change",
    });
    if (error) flash(null, error.message);
    else {
      setPhonePending(false);
      setPhoneCode("");
      flash("Phone number updated.");
      await refreshUser();
    }
    setBusy(null);
  }

  async function startTotp() {
    setBusy("totp");
    flash(null);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Plethora",
    });
    if (error || !data) {
      flash(null, error?.message || "Could not start 2FA");
      setBusy(null);
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setTotpSecret(data.totp.secret);
    setBusy(null);
  }

  async function confirmTotp() {
    if (!factorId) return;
    setBusy("totp-confirm");
    flash(null);
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      flash(null, challenge.error.message);
      setBusy(null);
      return;
    }
    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: totpCode.trim(),
    });
    if (verify.error) flash(null, verify.error.message);
    else {
      flash("Authenticator app is on.");
      setQr(null);
      setFactorId(null);
      setTotpCode("");
      setTotpSecret(null);
      await refreshUser();
    }
    setBusy(null);
  }

  async function removeFactor(id: string) {
    setBusy("unenroll");
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    flash(error ? null : "2FA factor removed.", error?.message);
    await refreshUser();
    setBusy(null);
  }

  async function portal() {
    setBusy("portal");
    flash(null);
    const r = await fetch("/api/billing/portal", { method: "POST" });
    const d = (await r.json()) as { url?: string; error?: string };
    if (d.url) window.location.href = d.url;
    else flash(null, d.error || "Billing portal isn’t available yet.");
    setBusy(null);
  }

  async function onAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    const dataUrl = await fileToAvatarDataUrl(file);
    saveCustomAvatar(user.id, dataUrl);
    setAvatar(dataUrl);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-16 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading account…
      </div>
    );
  }

  if (!user) return null;

  const google = user.app_metadata?.provider === "google" ||
    user.identities?.some((i) => i.provider === "google");

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Email, phone, security, and billing. Your email is only shown here and inside the account
          menu — not in the header.
        </p>
      </div>

      {(msg || err) && (
        <p className={`text-sm ${err ? "text-red-400" : "text-emerald-400"}`}>{err || msg}</p>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold text-white">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" referrerPolicy="no-referrer" className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-white/10" />
          )}
          <div className="space-y-2">
            <p className="text-sm text-zinc-300">{displayName(user)}</p>
            <label className={ghost + " cursor-pointer"}>
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => void onAvatar(e)} />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold text-white">Email</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Current login email. Changing it sends a confirmation link.
          {google ? " You signed in with Google — you can still add a different email." : ""}
        </p>
        <input className={field + " mt-4"} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className={btn + " mt-3"} disabled={busy === "email"} onClick={() => void saveEmail()}>
          {busy === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
          Update email
        </button>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-zinc-400" />
          <h2 className="text-lg font-semibold text-white">Phone</h2>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Use international format, e.g. +14155551234. SMS must be enabled on the project (Twilio /
          similar in Supabase Auth).
        </p>
        <input
          className={field + " mt-4"}
          type="tel"
          placeholder="+1…"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button className={btn + " mt-3"} disabled={busy === "phone"} onClick={() => void sendPhone()}>
          {busy === "phone" && <Loader2 className="h-4 w-4 animate-spin" />}
          Send code
        </button>
        {phonePending && (
          <div className="mt-4 space-y-2">
            <input
              className={field}
              placeholder="6-digit code"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
            />
            <button className={btn} disabled={busy === "phone-code"} onClick={() => void verifyPhone()}>
              Confirm phone
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-zinc-400" />
          <h2 className="text-lg font-semibold text-white">Two-factor authentication</h2>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Authenticator app (Google Authenticator, Authy, 1Password). Scan the QR, then enter a
          code.
        </p>
        {factors.filter((f) => f.status === "verified").length > 0 && (
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {factors
              .filter((f) => f.status === "verified")
              .map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <span>On · {f.friendly_name || "Authenticator"}</span>
                  <button className="text-red-300 hover:underline" onClick={() => void removeFactor(f.id)}>
                    Remove
                  </button>
                </li>
              ))}
          </ul>
        )}
        {!qr && (
          <button className={btn + " mt-4"} disabled={busy === "totp"} onClick={() => void startTotp()}>
            {busy === "totp" && <Loader2 className="h-4 w-4 animate-spin" />}
            Set up authenticator
          </button>
        )}
        {qr && (
          <div className="mt-4 space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="2FA QR code" className="h-40 w-40 rounded-lg bg-white p-2" />
            {totpSecret && (
              <p className="break-all font-mono text-xs text-zinc-400">Secret: {totpSecret}</p>
            )}
            <input
              className={field}
              placeholder="6-digit code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
            />
            <button className={btn} disabled={busy === "totp-confirm"} onClick={() => void confirmTotp()}>
              Confirm 2FA
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-zinc-400" />
          <h2 className="text-lg font-semibold text-white">Subscription & payments</h2>
        </div>
        <p className="mt-2 text-sm text-zinc-300">
          Current plan: <span className="font-medium text-white">{plan}</span>
        </p>
        {routeLabel && <p className="mt-1 text-sm text-zinc-500">{routeLabel}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/pricing" className={btn}>
            View plans
          </Link>
          <Link href="/settings/billing" className={ghost}>
            Usage, packs & limits
          </Link>
          <button className={ghost} disabled={busy === "portal" || !stripeReady} onClick={() => void portal()}>
            {busy === "portal" && <Loader2 className="h-4 w-4 animate-spin" />}
            Manage payment methods
          </button>
        </div>
        {!stripeReady && (
          <p className="mt-3 text-xs text-zinc-500">
            Stripe isn’t connected on this deploy yet — plans still show on the pricing page.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-zinc-400" />
          <h2 className="text-lg font-semibold text-white">More</h2>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link href="/settings/ai-keys" className="text-violet-300 hover:underline">
            API keys (BYOK)
          </Link>
          <span className="text-zinc-600">·</span>
          <Link href="/settings/personal" className="text-violet-300 hover:underline">
            Personalised context
          </Link>
          <span className="text-zinc-600">·</span>
          <Link href="/legal/privacy" className="text-violet-300 hover:underline">
            Privacy
          </Link>
        </div>
      </section>
    </div>
  );
}
