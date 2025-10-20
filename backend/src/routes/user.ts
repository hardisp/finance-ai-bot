
import { getUserMe } from "../controllers/userController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Router } from "express";
import { loginDemoUser } from "../controllers/userController.js";

const router = Router();

router.get("/me", requireAuth, getUserMe);
router.post("/login", loginDemoUser);

export default router;