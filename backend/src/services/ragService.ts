// backend/src/services/ragServices.ts
import { PrismaClient } from "@prisma/client";
import { createClient as createRedisClient } from "redis";
import OpenAI from "openai";

const prisma = new PrismaClient();
const redis = createRedisClient({ url: process.env.REDIS_URL });
await redis.connect();

// Determine if we use mock embeddings
const useMockEmbeddings = process.env.USE_MOCK_EMBEDDINGS === "true";

// OpenAI client (only used if not mocking)
const openai = !useMockEmbeddings
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Mock embeddings function
function mockEmbed(text: string): number[] {
  const hash = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return [hash % 10, (hash * 2) % 10, (hash * 3) % 10, (hash * 5) % 10, (hash * 7) % 10];
}

// Helper to get embeddings (mock or real)
async function getEmbeddings(text: string): Promise<number[]> {
  if (useMockEmbeddings) {
    console.log("[Mock] Generating embedding for:", text);
    return mockEmbed(text);
  }

  console.log("[OpenAI] Requesting embedding for:", text);
  const response = await openai!.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// Index tasks or other user data into Redis
export async function indexUserData(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Task: true, OngoingInstruction: true },
    });

    if (!user) throw new Error("User not found");

    console.log(`[Index] Found ${user.Task.length} tasks for user ${user.email}`);

    for (const task of user.Task) {
      try {
        const vector = await getEmbeddings(task.description);
        console.log(`[Index] Task ${task.id} embedding length:`, vector.length);

        await redis.hSet(
          `user:${userId}:taskEmbeddings`,
          task.id,
          JSON.stringify(vector)
        );
        console.log(`[Index] Stored task ${task.id} in Redis`);
      } catch (e) {
        console.error("Error embedding task:", task.id, e);
      }
    }

    console.log(`[Index] Completed indexing user ${user.email}`);
  } catch (e) {
    console.error("Indexing error:", e);
    throw e;
  }
}

// Query user's data embeddings
export async function queryUserData(userId: string, query: string) {
  try {
    const taskEmbeddings = await redis.hGetAll(`user:${userId}:taskEmbeddings`);
    if (Object.keys(taskEmbeddings).length === 0) {
      console.warn(`[Query] No embeddings found for user ${userId}`);
      return null;
    }

    const queryVector = await getEmbeddings(query);
    console.log("[Query] Query vector length:", queryVector.length);

    let bestMatch = "";
    let bestScore = -Infinity;

    for (const [taskId, vectorStr] of Object.entries(taskEmbeddings)) {
      const vector = JSON.parse(vectorStr) as number[];
      const score = cosineSimilarity(queryVector, vector);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = taskId;
      }
    }

    console.log(`[Query] Best match: ${bestMatch} with score: ${bestScore}`);

    if (!bestMatch) return null;

    const matchedTask = await prisma.task.findUnique({ where: { id: bestMatch } });
    return matchedTask;
  } catch (e) {
    console.error("Querying error:", e);
    throw e;
  }
}

// Helper: cosine similarity
function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}
