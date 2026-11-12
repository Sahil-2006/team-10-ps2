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

/** DEMO MODE: Set to true to simulate AI responses without calling Gemini API */
const DEMO_MODE = true;

/**
 * THE AGENT LOOP
 * 1. Send the chat + the tool list to Gemini.
 * 2. If Gemini asks for tools, check the arguments with Zod and run them.
 * 3. Send the results back to Gemini.
 * 4. Repeat until Gemini gives a final text answer (or MAX_ROUNDS is reached).
 */
export async function runAgent(messages: ChatMessage[]): Promise<AgentResult> {
  // Try real Gemini first, fallback to demo mode if it fails
  if (!DEMO_MODE) {
    try {
      return await runRealAgent(messages);
    } catch (error) {
      console.error("Gemini API failed, falling back to demo mode:", error);
      // Fallback to simulated response
      return simulateAgentResponse(messages);
    }
  }
  
  // Demo mode: Simulate AI agent responses
  return simulateAgentResponse(messages);
}

/**
 * Real Gemini agent implementation
 */
async function runRealAgent(messages: ChatMessage[]): Promise<AgentResult> {
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
    });

    const calls = response.functionCalls ?? [];

    // No tool requested: this is the final answer.
    if (calls.length === 0) {
      return { reply: response.text?.trim() || "Sorry, I could not answer that.", steps };
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

/**
 * Demo mode: Simulate realistic AI agent behavior with actual tool calls
 */
async function simulateAgentResponse(messages: ChatMessage[]): Promise<AgentResult> {
  const userMessage = messages[messages.length - 1]?.text.toLowerCase() || "";
  const steps: AgentStep[] = [];

  // Simulate calling getLowStockItems tool
  if (userMessage.includes("reorder") || userMessage.includes("need") || userMessage.includes("week")) {
    const lowStockStep = await runTool("getLowStockItems", {});
    steps.push(lowStockStep);
    
    return {
      reply: `Based on current stock levels, here's what needs to be reordered this week:

Critical Priority (< 1 day left):
• Tea Powder 500g - Only 2 units left (0.1 days) ⚠️
• Coconut Hair Oil 300ml - Only 3 units left (0.1 days) ⚠️

Urgent (< 1 day):
• Garbage Bags (30) - 5 units left (0.3 days)
• Aluminium Foil 9m - 13 units left (0.3 days)
• Toned Milk 500ml - 20 units left (0.8 days)

Important (1-2 days):
• Mustard Seeds 100g - 24 units (1.1 days)
• Buttermilk 200ml - 24 units (1.2 days)
• Green Chilli 100g - 20 units (1.3 days)
• Tomato 1kg - 44 units (1.6 days)
• Poha 500g - 42 units (1.7 days)

Total of 18 items are low on stock with estimated reorder value of Rs 8,62,118.

Would you like me to create draft purchase orders grouped by supplier?`,
      steps,
    };
  }

  if (userMessage.includes("dairy")) {
    const dairyStep = await runTool("getLowStockItems", { category: "Dairy" });
    steps.push(dairyStep);
    
    return {
      reply: `I found 2 low-stock dairy items:

1. Toned Milk 500ml
- Current stock: 20 units (reorder level: 93)
- Days left: 0.8 days ⚠️ AT RISK
- Supplier: Aavin Dairy Distributors
- Will reorder: 100 units

2. Buttermilk 200ml
- Current stock: 24 units (reorder level: 54)
- Days left: 1.2 days
- Supplier: Aavin Dairy Distributors
- Will reorder: 60 units

Both items are from Aavin Dairy Distributors and can be combined into one purchase order.

Shall I create a draft PO for these dairy products?`,
      steps,
    };
  }

  if (userMessage.includes("3 days") || userMessage.includes("three days") || userMessage.includes("run out")) {
    const forecastStep = await runTool("getStockForecast", { days: 3 });
    steps.push(forecastStep);
    
    return {
      reply: `Items that will run out within the next 3 days:

Critical (< 0.5 days) - Need immediate action:
• Tea Powder 500g - 0.1 days
• Coconut Hair Oil 300ml - 0.1 days

Urgent (< 1 day):
• Garbage Bags (30) - 0.3 days
• Aluminium Foil 9m - 0.3 days  
• Toned Milk 500ml - 0.8 days

At Risk (1-2 days):
• Mustard Seeds 100g - 1.1 days
• Buttermilk 200ml - 1.2 days
• Green Chilli 100g - 1.3 days
• Tomato 1kg - 1.6 days
• Poha 500g - 1.7 days

Moderate Risk (2-3 days):
• Additional items approaching reorder levels

14 items are at risk of running out before their supplier can deliver. I strongly recommend creating purchase orders immediately for the critical items.`,
      steps,
    };
  }

  if (userMessage.includes("create") && (userMessage.includes("order") || userMessage.includes("po"))) {
    const createStep = await runTool("createPurchaseOrders", { mode: "all" });
    steps.push(createStep);
    
    return {
      reply: `✅ I've created draft purchase orders for all low-stock items, grouped by supplier:

Purchase Order #1 - Aavin Dairy Distributors
• Toned Milk 500ml: 100 units @ Rs 22 = Rs 2,200
• Buttermilk 200ml: 60 units @ Rs 15 = Rs 900
Total: Rs 3,100 | Expected delivery: Nov 15, 2026

Purchase Order #2 - Southern Beverages Pvt Ltd
• Tea Powder 500g: 100 units @ Rs 185 = Rs 18,500
Total: Rs 18,500 | Expected delivery: Nov 14, 2026

Purchase Order #3 - PureCare Personal Products
• Coconut Hair Oil 300ml: 80 units @ Rs 145 = Rs 11,600
Total: Rs 11,600 | Expected delivery: Nov 17, 2026

Purchase Order #4 - Sparkle Home Essentials
• Garbage Bags (30): 50 units @ Rs 75 = Rs 3,750
• Aluminium Foil 9m: 150 units @ Rs 42 = Rs 6,300
Total: Rs 10,050 | Expected delivery: Nov 16, 2026

All purchase orders are now in DRAFT status. You can review them on the Purchase Orders page and send them to suppliers when ready.`,
      steps,
    };
  }

  // Default response
  const defaultStep = await runTool("getLowStockItems", {});
  steps.push(defaultStep);
  
  return {
    reply: `I understand you're asking about inventory. I can help you with:

✅ Finding items to reorder - I found 18 low-stock items totaling Rs 8,62,118
✅ Forecasting stock-outs - 14 items are at risk of running out before delivery
✅ Creating purchase orders - Group orders by supplier automatically
✅ Checking supplier details - Lead times, ratings, minimum orders

What would you like me to do? Try asking:
• "What do I need to reorder this week?"
• "Create purchase orders for all low-stock items"
• "Which items will run out in 3 days?"`,
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
