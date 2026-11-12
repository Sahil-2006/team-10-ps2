import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/** GET /api/health  -> shows which settings are missing (never shows the values) and checks the products table. */
export async function GET() {
  // GEMINI_MODEL is optional (it has a default), so it is not checked here.
  const names = ["GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SECRET_KEY", "APP_PASSCODE"];
  const settings = Object.fromEntries(names.map((n) => [n, Boolean(process.env[n]?.trim())]));
  const envOk = Object.values(settings).every(Boolean);
  let database = false;
  if (envOk) {
    const { error } = await getSupabase().from("products").select("sku").limit(1);
    database = !error;
  }
  return NextResponse.json({ ok: envOk && database, settings, database });
}
