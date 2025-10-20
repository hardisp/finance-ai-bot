import { Request, Response } from "express";
import { prisma } from "../../prisma/client.js";
import jwt from "jsonwebtoken";

// ----- User Profile -----
export const getUserProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  res.json(user);
};

export const updateUserProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { name } = req.body;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name },
  });
  res.json(updated);
};

// ----- Tasks -----
export const createTask = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { description, status } = req.body;
  const task = await prisma.task.create({
    data: { userId, description, status },
  });
  res.json(task);
};

export const getTasks = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const tasks = await prisma.task.findMany({ where: { userId } });
  res.json(tasks);
};

export const updateTask = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { description, status } = req.body;

  const task = await prisma.task.update({
    where: { id },
    data: { description, status },
  });
  res.json(task);
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.task.delete({ where: { id } });
  res.json({ success: true });
};

// ----- Ongoing Instructions -----
export const createInstruction = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { rule } = req.body;
  const instruction = await prisma.ongoingInstruction.create({
    data: { userId, rule },
  });
  res.json(instruction);
};

export const getInstructions = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const instructions = await prisma.ongoingInstruction.findMany({ where: { userId } });
  res.json(instructions);
};

export const updateInstruction = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rule } = req.body;
  const updated = await prisma.ongoingInstruction.update({
    where: { id },
    data: { rule },
  });
  res.json(updated);
};

export const deleteInstruction = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.ongoingInstruction.delete({ where: { id } });
  res.json({ success: true });
};

export const loginDemoUser = async (req: Request, res: Response) => {
  try {
    // For testing, we use the demo user
    const user = await prisma.user.findUnique({
      where: { email: "demo@financeai.local" },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to login" });
  }
};