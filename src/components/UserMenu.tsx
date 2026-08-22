"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  displayName,
  fileToAvatarDataUrl,
  loadCustomAvatar,
  oauthAvatarUrl,
  saveCustomAvatar,
} from "@/lib/user-avatar";
import {
  BarChart3,
  ChevronDown,
  History,
  ImagePlus,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  User as UserIcon,
  FolderKanban,
  CreditCard,
  FileText,
  RotateCcw,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function UserMenu({ user }: { user: SupabaseUser | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      setAvatar(null);
      return;
    }
    setAvatar(loadCustomAvatar(user.id) || oauthAvatarUrl(user));
  }, [user]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      saveCustomAvatar(user.id, dataUrl);
      setAvatar(dataUrl);
    } catch {
      /* ignore */
    }
  }

  function useGooglePhoto() {
    if (!user) return;
    saveCustomAvatar(user.id, null);
    setAvatar(oauthAvatarUrl(user));
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

  const name = displayName(user);
  const item =
    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 hover:bg-white/8";

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onPickFile(e)}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 p-1 pr-2 text-sm text-zinc-200 hover:bg-white/5"
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            referrerPolicy="no-referrer"
            className="h-7 w-7 rounded-md object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
            <UserIcon className="h-4 w-4 text-zinc-400" />
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-zinc-500 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#12121a] py-1 shadow-xl"
        >
          <div className="border-b border-white/10 px-3 py-2">
            <p className="truncate text-sm font-medium text-white">{name}</p>
            <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
          </div>
          <Link href="/dashboard" className={item} onClick={() => setOpen(false)}>
            <LayoutDashboard className="h-4 w-4 text-zinc-400" />
            Dashboard
          </Link>
          <Link href="/workspaces" className={item} onClick={() => setOpen(false)}>
            <FolderKanban className="h-4 w-4 text-zinc-400" />
            Workspaces
          </Link>
          <Link href="/settings/billing" className={item} onClick={() => setOpen(false)}>
            <BarChart3 className="h-4 w-4 text-zinc-400" />
            Usage & billing
          </Link>
          <Link href="/history" className={item} onClick={() => setOpen(false)}>
            <History className="h-4 w-4 text-zinc-400" />
            History
          </Link>
          <div className="my-1 h-px bg-white/10" />
          <button type="button" className={item} onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4 text-zinc-400" />
            Change avatar
          </button>
          {oauthAvatarUrl(user) && (
            <button type="button" className={item} onClick={useGooglePhoto}>
              <RotateCcw className="h-4 w-4 text-zinc-400" />
              Use Google photo
            </button>
          )}
          <Link href="/settings" className={item} onClick={() => setOpen(false)}>
            <Settings className="h-4 w-4 text-zinc-400" />
            Settings
          </Link>
          <Link href="/settings/ai-keys" className={item} onClick={() => setOpen(false)}>
            <KeyRound className="h-4 w-4 text-zinc-400" />
            API keys
          </Link>
          <Link href="/settings/billing" className={item} onClick={() => setOpen(false)}>
            <CreditCard className="h-4 w-4 text-zinc-400" />
            Plans
          </Link>
          <div className="my-1 h-px bg-white/10" />
          <Link href="/legal/privacy" className={item} onClick={() => setOpen(false)}>
            <Shield className="h-4 w-4 text-zinc-400" />
            Privacy
          </Link>
          <Link href="/legal/terms" className={item} onClick={() => setOpen(false)}>
            <FileText className="h-4 w-4 text-zinc-400" />
            Terms
          </Link>
          <div className="my-1 h-px bg-white/10" />
          <button type="button" className={`${item} text-red-300 hover:bg-red-500/10`} onClick={() => void handleSignOut()}>
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
