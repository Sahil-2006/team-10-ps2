import { NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import { agentRequestSchema } from "@/lib/schemas";
import { runAgent } from "@/lib/agent/runGemini";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/agent  body: { messages: [{ role: "user" | "model", text: string }] } */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = agentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await runAgent(parsed.data.messages);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ApiError) {
      console.error("[agent] Gemini request failed", err.status);
      if (err.status === 429) {
        return NextResponse.json({ error: "Gemini quota reached. Wait a minute and try again." }, { status: 429 });
      }
      if (err.status === 401 || err.status === 403 || /API_KEY_INVALID|API key not valid/i.test(err.message)) {
        return NextResponse.json({ error: "Gemini rejected the server's API key. Check GEMINI_API_KEY and its permissions." }, { status: 503 });
      }
      if (err.status === 404) {
        return NextResponse.json({ error: "The configured Gemini model is unavailable. Check GEMINI_MODEL on the server." }, { status: 503 });
      }
    }
    if (!process.env.GEMINI_API_KEY?.trim()) {
      return NextResponse.json({ error: "Set GEMINI_API_KEY on the server to enable the assistant." }, { status: 503 });
    }
    return NextResponse.json({ error: "The assistant could not finish this request. Check Purchase Orders for any changes." }, { status: 502 });
  }
}
