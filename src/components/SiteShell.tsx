import { Header, Footer } from "@/components/Header";
import type { User } from "@supabase/supabase-js";

/**
 * Auth user is optional. Never block the whole shell on remote Supabase —
 * missing env or a hanging getUser() was a common cause of endless loading.
 */
async function getUserSafe(): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-") || key.includes("your-")) {
    return null;
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null } }), 2500)
      ),
    ]);
    return result.data.user ?? null;
  } catch {
    return null;
  }
}

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const user = await getUserSafe();

  return (
    <>
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
