import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { queryUserData } from "../services/ragService.js";

const router = Router();

// POST /api/query
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { query } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const result = await queryUserData(userId, query);
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to query user data" });
  }
});

export default router;
