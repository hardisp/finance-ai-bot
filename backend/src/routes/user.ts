
import { getUserProfile, updateUserProfile } from "../controllers/userController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Router } from "express";
import { loginDemoUser } from "../controllers/userController.js";

const router = Router();

router.get("/me", requireAuth, getUserProfile);
router.post("/login", loginDemoUser);
router.patch("/me", requireAuth, updateUserProfile);

export default router;