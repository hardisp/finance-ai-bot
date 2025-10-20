import OpenAI from "openai";
import { queryUserData } from "./ragService.js";

import { handleToolAction } from "./toolService.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function answerQuestion(userId: string, question: string) {
  const contextTask = await queryUserData(userId, question);
  const contextText = contextTask ? contextTask.description : "No relevant context found.";

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful financial advisor assistant." },
      { role: "user", content: `${question}\n\nContext: ${contextText}` },
    ],
  });

  return completion.choices[0].message?.content || "";
}


// Example: agent parses GPT output for actions
export async function processAgentResponse(userId: string, response: string) {
  const parsed = JSON.parse(response); // assuming GPT outputs JSON { tool, params }
  return await handleToolAction(userId, parsed);
}
