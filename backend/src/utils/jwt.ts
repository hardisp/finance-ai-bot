import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export const signToken = (userId: string) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string) =>
  jwt.verify(token, JWT_SECRET) as { userId: string };
