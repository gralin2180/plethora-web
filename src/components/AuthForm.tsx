"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function emailRedirectUrl(nextPath: string) {
  const configured =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PLETHORA_SITE_URL?.replace(/\/$/, "")) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const base = configured || (typeof window !== "undefined" ? window.location.origin : "");
  const next = encodeURIComponent(nextPath);
  return `${base}/auth/callback?next=${next}`;
}

const SOCIAL: { id: Provider; label: string; icon: ReactNode }[] = [
  {
    id: "google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 10.2v3.6h5.1c-.2 1.2-1.4 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1-.1-1.4H12z"
        />
        <path
          fill="#34A853"
          d="M3.9 7.4 6.9 9.6C7.7 7.6 9.7 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.6 2.8 12 2.8 8.4 2.8 5.3 4.8 3.9 7.4z"
        />
        <path
          fill="#4285F4"
          d="M12 21.2c2.5 0 4.6-.8 6.1-2.3l-2.8-2.2c-.8.6-1.9 1-3.3 1-3.6 0-6.7-2.4-7.8-5.7l-3 2.3C3.7 18.6 7.5 21.2 12 21.2z"
        />
        <path
          fill="#FBBC05"
          d="M4.2 14.1c-.2-.6-.4-1.3-.4-2.1s.1-1.5.4-2.1l-3-2.3C.7 9.1.4 10.5.4 12s.3 2.9.8 4.2l3-2.1z"
        />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Apple",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
        <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.2c.7-1.1 1-2.1 1-2.2-.1 0-2-.8-2-3.2zM14.7 5.9c.6-.8 1.1-1.8.9-2.9-0.9.1-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.8 1 .1 2-.5 2.6-1.3z" />
      </svg>
    ),
  },
  {
    id: "github",
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
        <path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1 .8-.2 1.6-.3 2.4-.3s1.6.1 2.4.3c2-.1.8 2.8 1 2.8.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5C19.1 20.2 22 16.4 22 12 22 6.5 17.5 2 12 2z" />
      </svg>
    ),
  },
  {
    id: "discord",
    label: "Discord",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#5865F2]" aria-hidden>
        <path d="M19.3 5.2A17 17 0 0 0 15 4l-.2.4c1.6.4 3 1 4.4 1.9-1.7-1-3.7-1.6-5.8-1.6h-.8c-2.1 0-4.1.6-5.8 1.6A14 14 0 0 1 9.2 4.4 17 17 0 0 0 4.7 5.2C2.3 8.8 1.7 12.3 2 15.8A17 17 0 0 0 7.3 18l.6-.9c-.8-.3-1.5-.7-2.2-1.2.2.1.3.2.5.3 2.2 1.1 4.6 1.7 7 1.7s4.8-.6 7-1.7l.5-.3c-.7.5-1.4.9-2.2 1.2l.6.9a17 17 0 0 0 5.3-2.2c.4-3.5-.2-7-2.6-10.6zM8.8 13.9c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7zm6.4 0c-.8 0-1.5-.8-1.5-1.7s.7-1.7 1.5-1.7 1.5.8 1.5 1.7-.7 1.7-1.5 1.7z" />
      </svg>
    ),
  },
];

const TERMS_KEY = "plethora.legal.accept.v1";

function loadTermsOk() {
  try {
    return localStorage.getItem(TERMS_KEY) === "1";
  } catch {
    return false;
  }
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) setMessage(err);
    setTerms(loadTermsOk());
  }, []);

  function rememberTerms() {
    try {
      localStorage.setItem(TERMS_KEY, "1");
      localStorage.setItem("plethora.legal.accept.at", new Date().toISOString());
    } catch {
      /* */
    }
  }

  function needTerms() {
    if (terms) return false;
    setMessage("Agree to the Terms before signing in with any account.");
    return true;
  }

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) setMessage(err);
  }, []);

  async function signInSocial(provider: Provider) {
    if (needTerms()) return;
    rememberTerms();
    setOauthLoading(provider);
    setMessage(null);
    const next = mode === "signup" ? "/onboarding" : "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: emailRedirectUrl(next),
        queryParams:
          provider === "google" ? { access_type: "offline", prompt: "select_account" } : undefined,
      },
    });
    if (error) {
      setMessage(
        error.message.includes("provider is not enabled")
          ? `${provider} sign-in is not turned on yet. Enable it in Supabase → Authentication → Providers.`
          : error.message
      );
      setOauthLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (needTerms()) return;
    rememberTerms();
    setLoading(true);
    setMessage(null);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: emailRedirectUrl("/dashboard"),
        },
      });
      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setMessage(
          "Check your email to confirm. Open the link — it should bring you back to Plethora (not a blank or wrong site). Then sign in if needed."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }
    setLoading(false);
  }

  const busy = loading || Boolean(oauthLoading);

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-zinc-400">
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I am 18+ if I use adult features, and I agree to the{" "}
          <Link href="/legal/terms" className="text-violet-300 hover:underline" target="_blank">
            Terms
          </Link>
          ,{" "}
          <Link href="/legal/privacy" className="text-violet-300 hover:underline" target="_blank">
            Privacy
          </Link>
          , and{" "}
          <Link href="/legal/acceptable-use" className="text-violet-300 hover:underline" target="_blank">
            Acceptable Use
          </Link>{" "}
          policies. Plethora is not legal, medical, or financial advice. Third-party AI and markets
          can be wrong.
        </span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        {SOCIAL.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy || !terms}
            onClick={() => void signInSocial(p.id)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-zinc-100 hover:bg-white/[0.08] disabled:opacity-60"
          >
            {oauthLoading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : p.icon}
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-zinc-600">
        <span className="h-px flex-1 bg-white/10" />
        or email
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
          />
        </div>
        {message && (
          <p
            className={`text-sm ${
              message.includes("Check your email") || message.includes("bring you back")
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !terms}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
        <p className="text-center text-sm text-zinc-500">
          {mode === "login" ? (
            <>
              No account?{" "}
              <Link href="/auth/signup" className="text-violet-400 hover:underline">
                Sign up free
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/auth/login" className="text-violet-400 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
