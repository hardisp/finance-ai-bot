import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask
} from "../controllers/userController.js";

const router = Router();

router.post("/", requireAuth, createTask);
router.get("/", requireAuth, getTasks);
router.patch("/:id", requireAuth, updateTask);
router.delete("/:id", requireAuth, deleteTask);

export default router;
