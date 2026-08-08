import { NextResponse } from "next/server";

/**
 * Tool request backlog — logs / stores for later product planning.
 * Body is also saved client-side; this endpoint is best-effort server receipt.
 */

type Body = {
  id?: string;
  title?: string;
  description?: string;
  email?: string;
  createdAt?: string;
};

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const title = body.title?.trim();
  const description = body.description?.trim();
  if (!title || !description) {
    return NextResponse.json({ error: "title and description required" }, { status: 400 });
  }

  // Server log for operators reading runtime logs
  console.info("[tool-request]", {
    id: body.id,
    title,
    description: description.slice(0, 500),
    email: body.email || null,
    createdAt: body.createdAt || new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, queued: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "POST a tool request: { title, description, email? }",
  });
}
