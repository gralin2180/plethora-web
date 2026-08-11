"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function emailRedirectUrl(nextPath: string) {
  // Prefer configured production site URL so confirmation emails hit the right host
  const configured =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PLETHORA_SITE_URL?.replace(/\/$/, "")) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const base = configured || (typeof window !== "undefined" ? window.location.origin : "");
  const next = encodeURIComponent(nextPath);
  return `${base}/auth/callback?next=${next}`;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        // Email confirm disabled — already signed in
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

  return (
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
        disabled={loading}
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
  );
}
