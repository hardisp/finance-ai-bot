import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // make sure this is set
});

async function test() {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "Hello, OpenAI!",
    });
    console.log("Embedding length:", response.data[0].embedding.length);
  } catch (err) {
    console.error("OpenAI error:", err);
  }
}

test();