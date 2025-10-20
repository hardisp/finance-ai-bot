// backend/src/controllers/taskController.ts
import { Request, Response } from "express";
import { prisma } from "../../prisma/client.js";

/**
 * Get all tasks for the authenticated user
 */
export const getTasks = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

/**
 * Create a new task for the authenticated user
 */
export const createTask = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { description, priority, dueDate } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!description) return res.status(400).json({ error: "Description required" });

  try {
    const task = await prisma.task.create({
      data: {
        userId,
        description,
        priority,   // NEW: Sprint 3 field
        dueDate,    // NEW: Sprint 3 field
      },
    });
    res.status(201).json({ success: true, task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
};

/**
 * Update an existing task
 */
export const updateTask = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { description, status, priority, dueDate } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const task = await prisma.task.updateMany({
      where: { id, userId },
      data: { description, status, priority, dueDate },
    });

    if (task.count === 0) return res.status(404).json({ error: "Task not found" });

    res.json({ success: true, updatedFields: { description, status, priority, dueDate } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const task = await prisma.task.deleteMany({
      where: { id, userId },
    });

    if (task.count === 0) return res.status(404).json({ error: "Task not found" });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task" });
  }
};
