import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { LocalLlmHub } from "@/components/LocalLlmHub";

export const metadata: Metadata = {
  title: "Local LLMs — add, create, train on your PC",
  description:
    "Run Ollama, LM Studio, llama.cpp on your GPU. Add GGUF models, create Ollama Modelfiles, train LoRA adapters. Weights stay on your machine.",
  keywords: [
    "local llm",
    "ollama",
    "lm studio",
    "train lora",
    "gguf",
    "run llama on pc",
    "private ai",
  ],
};

export default function LocalLlmsPage() {
  return (
    <SiteShell>
      <LocalLlmHub />
    </SiteShell>
  );
}
