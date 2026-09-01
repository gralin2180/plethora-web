import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { OfficeNativeApp } from "@/components/OfficeAppLabs";
import { getOfficeApp } from "@/lib/plethora-office";

type Props = { params: Promise<{ app: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { app } = await params;
  const a = getOfficeApp(app);
  if (!a) return { title: "Office app — Plethora" };
  return { title: `${a.name} — Plethora Office`, description: a.tagline };
}

export default async function OfficeAppPage({ params }: Props) {
  const { app } = await params;
  const a = getOfficeApp(app);
  if (!a) notFound();
  if (!a.native) {
    const { redirect } = await import("next/navigation");
    redirect(a.href);
  }

  return (
    <SiteShell>
      <div className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/office"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Plethora Office
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-white">{a.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Like {a.like} — {a.tagline}
          </p>
          <div className="mt-8">
            <OfficeNativeApp id={a.id} />
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
