import express from "express";
import { addApproval, getTodayApprovals, getAllApprovals, updateApprovalStatus } from "../controllers/approvals.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", addApproval);
router.get("/", getTodayApprovals);
router.get("/all", getAllApprovals);
router.patch("/:id", updateApprovalStatus);

export default router;
