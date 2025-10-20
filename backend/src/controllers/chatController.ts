import { Request, Response } from "express";
import { answerQuestion } from "../services/chatAgent.js";

export const askAgent = async (req: Request, res: Response) => {
  const { userId, question } = req.body;
  if (!userId || !question) return res.status(400).json({ error: "Missing userId or question" });

  try {
    const answer = await answerQuestion(userId, question);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get answer from agent" });
  }
};
