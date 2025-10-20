import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  createInstruction,
  getInstructions,
  updateInstruction,
  deleteInstruction
} from "../controllers/userController.js";

const router = Router();

router.post("/", requireAuth, createInstruction);
router.get("/", requireAuth, getInstructions);
router.patch("/:id", requireAuth, updateInstruction);
router.delete("/:id", requireAuth, deleteInstruction);

export default router;
