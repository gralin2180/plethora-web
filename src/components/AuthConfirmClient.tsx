"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Handles Supabase auth redirects that put tokens in the URL hash
 * (older/implicit style) after email confirm.
 */
export function AuthConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Confirming your email…");

  useEffect(() => {
    const next = searchParams.get("next") || "/dashboard";
    const safeNext =
      next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

    async function run() {
      const supabase = createClient();

      // Query-style session already set by cookie middleware?
      const {
        data: { session: existing },
      } = await supabase.auth.getSession();
      if (existing) {
        router.replace(safeNext);
        router.refresh();
        return;
      }

      // Hash: #access_token=…&refresh_token=…&type=signup
      const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
      if (hash) {
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (!error) {
            window.history.replaceState(null, "", window.location.pathname);
            router.replace(safeNext);
            router.refresh();
            return;
          }
          setStatus(error.message || "Could not complete login");
          return;
        }
      }

      // ?code= on this page (sometimes redirected wrong)
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace(safeNext);
          router.refresh();
          return;
        }
        setStatus(error.message);
        return;
      }

      setStatus("Link invalid or expired. Try signing in, or request a new confirmation email.");
    }

    void run();
  }, [router, searchParams]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <Loader2 className="mb-4 h-8 w-8 animate-spin text-violet-400" />
      <p className="text-sm text-zinc-300">{status}</p>
      <a href="/auth/login" className="mt-6 text-sm text-violet-400 hover:underline">
        Back to sign in
      </a>
    </div>
  );
}
