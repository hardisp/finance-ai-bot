import express from "express";
import { queryTask } from "../controllers/queryController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// POST /api/query
router.post("/", requireAuth, queryTask);

export default router;
