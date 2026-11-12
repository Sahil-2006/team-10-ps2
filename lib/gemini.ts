import "server-only";
import OpenAI from "openai";
import { requireEnv } from "./env";

let client: OpenAI | null = null;

export function getGemini(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: requireEnv("OPENROUTER_API_KEY"),
      baseURL: "https://openrouter.ai/api/v1",
    });
  }
  return client;
}
