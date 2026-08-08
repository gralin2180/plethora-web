import { createClient } from "@/lib/supabase/server";
import { Header, Footer } from "@/components/Header";
import { UserMenu } from "@/components/UserMenu";

export async function AuthHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <Header user={user} />;
}

export { Footer, UserMenu };
