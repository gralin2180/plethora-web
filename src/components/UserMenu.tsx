"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, LogOut, LayoutDashboard } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function UserMenu({ user }: { user: SupabaseUser | null }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <>
        <Link
          href="/auth/login"
          className="hidden rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 sm:inline-block"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
        >
          Start Free
        </Link>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
      >
        <LayoutDashboard className="h-4 w-4" />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
      <div className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5">
        <User className="h-4 w-4 text-zinc-400" />
        <span className="hidden max-w-[120px] truncate text-sm text-zinc-300 sm:inline">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="text-zinc-500 hover:text-white"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
