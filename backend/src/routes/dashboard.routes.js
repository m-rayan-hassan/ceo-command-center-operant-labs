import express from "express";
import { getDashboardStats, getLatestBriefing, addBriefing } from "../controllers/dashboard.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/stats", getDashboardStats);
router.get("/briefing", getLatestBriefing);
router.post("/briefing", addBriefing);

export default router;
