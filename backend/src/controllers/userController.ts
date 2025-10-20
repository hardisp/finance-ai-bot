import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma/client.js"; 

export const getUserMe = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { Task: true, OngoingInstruction: true },
  });
  res.json(user);
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
