/**
 * Local self-learning — stays in the browser (like personal context).
 * Powers: recent tools, personalized popularity, assistant hints.
 * Competitors (TAAFT / Futurepedia) show trending + personal history — we mix both.
 */

import { PLATFORM_TOOLS, getToolBySlug } from "./tools-registry";
import type { PlatformTool } from "./types";

const KEY = "plethora.selfLearn.v1";
const MAX_RECENT = 24;
const MAX_TOPICS = 40;

export interface SelfLearnState {
  version: 1;
  /** slug -> use count */
  toolCounts: Record<string, number>;
  /** newest first */
  recentSlugs: string[];
  /** favorite/bookmarked tool slugs */
  favorites: string[];
  /** chat topic weights from self-learn phrases */
  topicHits: Record<string, number>;
  lastChatTopics: string[];
  updatedAt: string;
}

/** Seed “most popular” until real usage accumulates (middleman traffic seeds). */
export const GLOBAL_POPULARITY: Record<string, number> = {
  "youtube-downloader": 100,
  "image-to-pdf": 95,
  "pdf-merge": 90,
  "bg-remover": 88,
  "image-format": 85,
  "prompt-assistant": 92,
  "ai-finder": 90,
  chat: 94,
  "blog-writer": 70,
  "ad-copy": 68,
  "hook-generator": 66,
  "image-to-video": 64,
  "prompt-to-image": 72,
  "pdf-editor": 60,
  "documenter": 55,
  "workflow-builder": 58,
  "claude-rules": 52,
  "csv-text-tools": 55,
  "slides-deck": 70,
  "excel-hub": 75,
  "excel-formulas": 65,
  "pitch-outline": 60,
  "latex-resume": 88,
  "ats-resume": 92,
  "message-automation": 72,
  "sitemap-finder": 96,
  "sitemap-validator": 94,
  "sitemap-urls": 80,
  "robots-txt": 78,
  "ai-bio-generator": 85,
  "ai-worksheet-generator": 70,
  "multi-clock": 82,
  "advanced-calculator": 90,
  "build-your-tool": 76,
  "request-tool": 50,
  "life-planner": 74,
  "calendar-generator": 73,
};

function empty(): SelfLearnState {
  return {
    version: 1,
    toolCounts: {},
    recentSlugs: [],
    favorites: [],
    topicHits: {},
    lastChatTopics: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadSelfLearn(): SelfLearnState {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw), version: 1 };
  } catch {
    return empty();
  }
}

function save(state: SelfLearnState) {
  if (typeof window === "undefined") return;
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(KEY, JSON.stringify(state));
}

/** Record tool open / run */
export function trackToolUse(slug: string, weight = 1) {
  if (typeof window === "undefined" || !slug) return;
  const s = loadSelfLearn();
  s.toolCounts[slug] = (s.toolCounts[slug] || 0) + weight;
  s.recentSlugs = [slug, ...s.recentSlugs.filter((x) => x !== slug)].slice(0, MAX_RECENT);
  save(s);
}

export function toggleFavorite(slug: string): boolean {
  const s = loadSelfLearn();
  if (s.favorites.includes(slug)) {
    s.favorites = s.favorites.filter((x) => x !== slug);
    save(s);
    return false;
  }
  s.favorites = [slug, ...s.favorites].slice(0, 40);
  save(s);
  return true;
}

export function isFavorite(slug: string): boolean {
  return loadSelfLearn().favorites.includes(slug);
}

/** Lightweight topic extraction from chat for personalization */
export function learnFromChat(userText: string) {
  if (typeof window === "undefined") return;
  const t = userText.toLowerCase().trim();
  if (t.length < 3) return;
  const s = loadSelfLearn();
  const topics = extractTopics(t);
  for (const topic of topics) {
    s.topicHits[topic] = (s.topicHits[topic] || 0) + 1;
  }
  if (topics[0]) {
    s.lastChatTopics = [topics[0], ...s.lastChatTopics.filter((x) => x !== topics[0])].slice(
      0,
      MAX_TOPICS
    );
  }
  save(s);
}

function extractTopics(t: string): string[] {
  const found: string[] = [];
  const rules: [RegExp, string][] = [
    [/\b(youtube|yt-dlp|download video)\b/, "youtube"],
    [/\b(pdf|merge|docx|word)\b/, "pdf"],
    [/\b(image|png|jpg|webp|photo)\b/, "image"],
    [/\b(blog|article|writer|writing)\b/, "writing"],
    [/\b(ad|marketing|ugc|hook|campaign)\b/, "marketing"],
    [/\b(code|cursor|claude|ollama|mcp|dev)\b/, "developer"],
    [/\b(video|ffmpeg|reel|tiktok)\b/, "video"],
    [/\b(prompt|midjourney|flux|stable diffusion)\b/, "prompts"],
    [/\b(automate|workflow|zapier|n8n)\b/, "automation"],
    [/\b(sad|dull|mood|anxious|lonely)\b/, "wellbeing"],
  ];
  for (const [re, topic] of rules) {
    if (re.test(t)) found.push(topic);
  }
  return found;
}

export function getRecentTools(limit = 12): PlatformTool[] {
  const s = loadSelfLearn();
  return s.recentSlugs
    .map((slug) => getToolBySlug(slug) || PLATFORM_TOOLS.find((t) => t.slug === slug))
    .filter(Boolean)
    .slice(0, limit) as PlatformTool[];
}

export function getPopularTools(limit = 12): PlatformTool[] {
  const s = loadSelfLearn();
  const scored = PLATFORM_TOOLS.map((t) => {
    const global = GLOBAL_POPULARITY[t.slug] || GLOBAL_POPULARITY[t.id] || 10;
    const personal = (s.toolCounts[t.slug] || 0) * 15;
    // mildly boost tools matching chat topics
    let topicBoost = 0;
    for (const [topic, hits] of Object.entries(s.topicHits)) {
      if (toolMatchesTopic(t, topic)) topicBoost += hits * 3;
    }
    return { t, score: global + personal + topicBoost };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.t);
}

export function getForYouTools(limit = 12): PlatformTool[] {
  const s = loadSelfLearn();
  if (!s.recentSlugs.length && !Object.keys(s.topicHits).length) {
    return getPopularTools(limit);
  }
  const scored = PLATFORM_TOOLS.map((t) => {
    let score = (s.toolCounts[t.slug] || 0) * 20;
    if (s.favorites.includes(t.slug)) score += 50;
    if (s.recentSlugs.includes(t.slug)) score += 25 - s.recentSlugs.indexOf(t.slug);
    for (const [topic, hits] of Object.entries(s.topicHits)) {
      if (toolMatchesTopic(t, topic)) score += hits * 8;
    }
    score += (GLOBAL_POPULARITY[t.slug] || 0) * 0.15;
    return { t, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.filter((x) => x.score > 0).slice(0, limit).map((x) => x.t);
}

function toolMatchesTopic(t: PlatformTool, topic: string): boolean {
  const blob = `${t.name} ${t.category} ${t.tags.join(" ")} ${t.taskKeywords.join(" ")}`.toLowerCase();
  return blob.includes(topic);
}

/** Compact string for assistant / API personalization (client may send). */
export function selfLearnSummaryForAssistant(): string {
  if (typeof window === "undefined") return "";
  const s = loadSelfLearn();
  const recent = s.recentSlugs.slice(0, 6);
  const topTopics = Object.entries(s.topicHits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);
  const parts: string[] = [];
  if (recent.length) parts.push(`Recently used tools: ${recent.join(", ")}`);
  if (topTopics.length) parts.push(`Interest topics: ${topTopics.join(", ")}`);
  if (s.favorites.length) parts.push(`Favorites: ${s.favorites.slice(0, 5).join(", ")}`);
  return parts.join(". ");
}
