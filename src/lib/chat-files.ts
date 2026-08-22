/**
 * Chat files live on THIS device (IndexedDB / memory).
 * We do not upload originals to Vercel or Supabase — those quotas are tiny.
 * Only a short text extract is sent to the model (context window + 4.5MB request cap).
 *
 * If we later need cross-device sync: Cloudflare R2 (10 GB/mo free, $0 egress)
 * is the first paid-infra-free option. Not wired yet.
 */

export type ChatFileKind = "image" | "document" | "other";

export type PreparedChatFile = {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: ChatFileKind;
  /** Short extract for the model — never the whole file */
  extract: string;
  /** Tiny jpeg for UI only */
  thumb?: string;
};

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_EXTRACT = 5_500;
const DB = "plethora.chat.files.v1";
const STORE = "blobs";

function kindOf(mime: string, name: string): ChatFileKind {
  if (mime.startsWith("image/")) return "image";
  const n = name.toLowerCase();
  if (
    mime.includes("pdf") ||
    mime.includes("text") ||
    mime.includes("json") ||
    mime.includes("markdown") ||
    /\.(pdf|txt|md|csv|json|html|xml|log)$/i.test(n)
  ) {
    return "document";
  }
  return "other";
}

async function idbPut(id: string, blob: Blob) {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).put(blob, id);
    });
  } catch {
    /* private mode */
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function readTextCapped(file: File, max = MAX_EXTRACT): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || "").slice(0, max));
    r.onerror = () => reject(r.error);
    r.readAsText(file.slice(0, max * 4));
  });
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages = Math.min(doc.numPages, 8);
  let out = "";
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const t = content.items
      .map((it) => ("str" in it ? String((it as { str?: string }).str || "") : ""))
      .join(" ");
    out += t + "\n";
    if (out.length >= MAX_EXTRACT) break;
  }
  return out.slice(0, MAX_EXTRACT);
}

function thumbFromImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 160;
      const s = Math.min(max / img.width, max / img.height, 1);
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * s));
      c.height = Math.max(1, Math.round(img.height * s));
      const ctx = c.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

export async function prepareChatFile(file: File): Promise<PreparedChatFile> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`“${file.name}” is over 20 MB. Keep the original on your disk; we only index a slice.`);
  }
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const mime = file.type || "application/octet-stream";
  const kind = kindOf(mime, file.name);
  let extract = "";
  let thumb: string | undefined;
  if (kind === "document") {
    try {
      extract = mime.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")
        ? await extractPdf(file)
        : await readTextCapped(file);
    } catch {
      extract = `(Couldn’t read text from ${file.name}.)`;
    }
  } else if (kind === "image") {
    try {
      thumb = await thumbFromImage(file);
    } catch {
      /* skip */
    }
    extract = `[Image attached: ${file.name}. This free chat path only sees the filename, not pixels. Describe what you want from it.]`;
  } else {
    extract = `[File attached: ${file.name} (${Math.round(file.size / 1024)} KB). Binary — not parsed. Tell me what to do with it.]`;
  }
  void idbPut(id, file);
  return {
    id,
    name: file.name,
    mime,
    size: file.size,
    kind,
    extract: extract.trim(),
    thumb,
  };
}

export function filesToModelBlock(files: PreparedChatFile[]): string {
  if (!files.length) return "";
  let budget = MAX_EXTRACT;
  const parts: string[] = ["Attached files (text extract only; originals stay on this device):"];
  for (const f of files) {
    const chunk = `\n### ${f.name}\n${f.extract}`.slice(0, Math.max(200, budget));
    parts.push(chunk);
    budget -= chunk.length;
    if (budget <= 0) {
      parts.push("\n(Further files truncated to fit the model window.)");
      break;
    }
  }
  return parts.join("\n");
}
