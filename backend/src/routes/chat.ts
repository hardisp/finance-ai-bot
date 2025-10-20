import express from "express";
import { askAgent } from "../controllers/chatController.js";

const router = express.Router();

router.post("/ask", askAgent);

export default router;
