import { Request, Response } from "express";
import { queryUserData } from "../services/ragService.js";
import { prisma } from "../../prisma/client.js";

export const queryTask = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { query } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const matchedTask = await queryUserData(userId, query);
    if (!matchedTask) return res.json({ result: null });

    res.json({ result: matchedTask });
  } catch (err) {
    console.error("Query error:", err);
    res.status(500).json({ error: "Failed to query user data" });
  }
};
