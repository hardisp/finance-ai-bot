// backend/src/routes/task.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

const router = Router();

// Get all tasks for authenticated user
router.get("/", requireAuth, getTasks);

// Create a new task with optional priority and dueDate
router.post("/", requireAuth, createTask);

// Update an existing task (description, status, priority, dueDate)
router.patch("/:id", requireAuth, updateTask);

// Delete a task
router.delete("/:id", requireAuth, deleteTask);

export default router;
