import express from "express";
import { googleLogin, googleCallback } from "../controllers/googleOauthController.js";

const router = express.Router();

router.get("/login", googleLogin);
router.get("/callback", googleCallback);

export default router;
