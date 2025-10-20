// backend/src/controllers/ongoingInstructionController.ts
import { Request, Response } from "express";
import { prisma } from "../../prisma/client.js";

export const getInstructions = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const instructions = await prisma.ongoingInstruction.findMany({ where: { userId } });
    res.json({ instructions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch instructions" });
  }
};

export const createInstruction = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { rule } = req.body;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!rule) return res.status(400).json({ error: "Rule is required" });

  try {
    const instruction = await prisma.ongoingInstruction.create({
      data: { userId, rule },
    });
    res.status(201).json({ instruction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create instruction" });
  }
};

export const updateInstruction = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { rule } = req.body;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const instruction = await prisma.ongoingInstruction.updateMany({
      where: { id, userId },
      data: { rule },
    });

    if (instruction.count === 0) return res.status(404).json({ error: "Instruction not found" });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update instruction" });
  }
};

export const deleteInstruction = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const instruction = await prisma.ongoingInstruction.deleteMany({
      where: { id, userId },
    });

    if (instruction.count === 0) return res.status(404).json({ error: "Instruction not found" });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete instruction" });
  }
};
