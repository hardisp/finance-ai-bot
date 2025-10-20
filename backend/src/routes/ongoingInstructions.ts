// backend/src/routes/ongoingInstruction.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getInstructions,
  createInstruction,
  updateInstruction,
  deleteInstruction,
} from "../controllers/ongoingInstructionController.js";

const router = Router();

router.get("/", requireAuth, getInstructions);
router.post("/", requireAuth, createInstruction);
router.patch("/:id", requireAuth, updateInstruction);
router.delete("/:id", requireAuth, deleteInstruction);

export default router;
