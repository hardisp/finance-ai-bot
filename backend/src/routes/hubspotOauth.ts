import express from "express";
import { hubspotLogin, hubspotCallback } from "../controllers/hubspotOauthController.js";

const router = express.Router();

router.get("/login", hubspotLogin);
router.get("/callback", hubspotCallback);

export default router;
