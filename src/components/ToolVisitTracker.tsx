"use client";

import { useEffect } from "react";
import { trackToolUse } from "@/lib/self-learn";

/** Client-only visit logger for tool pages */
export function ToolVisitTracker({ slug }: { slug: string }) {
  useEffect(() => {
    trackToolUse(slug, 1);
  }, [slug]);
  return null;
}
