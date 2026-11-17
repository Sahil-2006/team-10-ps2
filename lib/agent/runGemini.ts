import "server-only";
import type { Content, Part } from "@google/genai";
import { getGemini } from "../gemini";
import { GEMINI_MODEL } from "../env";
import type { ChatMessage } from "../schemas";
import { tools } from "./tools";
import { toFunctionDeclarations } from "./defineTool";
import { buildSystemPrompt } from "./systemPrompt";
import type { AgentResult, AgentStep } from "./types";

/** Stops the agent from looping forever and using up your Gemini quota. */
const MAX_ROUNDS = 8;

/**
 * THE AGENT LOOP
 * 1. Send the chat + the tool list to Gemini.
 * 2. If Gemini asks for tools, check the arguments with Zod and run them.
 * 3. Send the results back to Gemini.
 * 4. Repeat until Gemini gives a final text answer (or MAX_ROUNDS is reached).
 */
export async function runAgent(messages: ChatMessage[]): Promise<AgentResult> {
  const ai = getGemini();
  const steps: AgentStep[] = [];
  const functionDeclarations = toFunctionDeclarations(tools);

  const contents: Content[] = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: buildSystemPrompt(),
        tools: [{ functionDeclarations }],
        temperature: 0.2,
      },
    }).catch((error: unknown) => {
      // A later Gemini failure must not hide an order that the server already saved.
      if (steps.some((step) => step.writes && step.ok)) return null;
      throw error;
    });
    if (!response) {
      return {
        reply: "Order changes were saved. Gemini could not finish the summary. Open Purchase Orders to review the changes.",
        steps,
      };
    }

    const calls = response.functionCalls ?? [];

    // No tool requested: this is the final answer.
    if (calls.length === 0) {
      return { reply: response.text?.trim() || "Gemini returned an empty reply. Check the tool steps for any actions taken.", steps };
    }

    // Keep Gemini's own turn (it carries the tool request) in the history.
    const modelTurn = response.candidates?.[0]?.content;
    if (modelTurn) contents.push(modelTurn);

    const responseParts: Part[] = [];
    for (const call of calls) {
      const step = await runTool(call.name ?? "", call.args ?? {});
      steps.push(step);
      responseParts.push({
        functionResponse: {
          id: call.id,
          name: call.name,
          response: step.ok ? { result: step.result } : { error: step.error },
        },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  return {
    reply: "I needed too many steps for this request. Please try a simpler or more specific question.",
    steps,
  };
}

async function runTool(name: string, rawArgs: unknown): Promise<AgentStep> {
  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    return { tool: name, args: rawArgs, ok: false, writes: false, error: `Unknown tool: ${name}` };
  }

  // Never trust the model's arguments: check them with Zod first.
  const parsed = tool.schema.safeParse(rawArgs);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".") || "args"}: ${i.message}`).join("; ");
    return { tool: name, args: rawArgs, ok: false, writes: tool.writes, error: `Invalid arguments: ${message}` };
  }

  try {
    const result = await tool.run(parsed.data);
    return { tool: name, args: parsed.data, ok: true, writes: tool.writes, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool failed";
    return { tool: name, args: parsed.data, ok: false, writes: tool.writes, error: message };
  }
}
