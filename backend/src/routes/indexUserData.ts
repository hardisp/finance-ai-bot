import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { indexUserData } from "../services/ragService.js";

const router = Router();

// POST /api/index-user
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await indexUserData(userId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to index user data" });
  }
});

export default router;
