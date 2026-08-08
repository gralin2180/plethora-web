"use client";

import dynamic from "next/dynamic";
import { ProductTour } from "@/components/ProductTour";

const FloatingAssistant = dynamic(
  () => import("@/components/FloatingAssistant").then((m) => m.FloatingAssistant),
  { ssr: false }
);

export function ClientChrome() {
  return (
    <>
      <FloatingAssistant />
      <ProductTour />
    </>
  );
}
