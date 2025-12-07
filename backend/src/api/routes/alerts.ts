import { Router } from "express";
import { Alert } from "../../intelligence/alertService.js";

const router = Router();

// GET /alerts/recent
router.get("/recent", async (req, res) => {
  try {
    const alerts = await Alert.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(alerts);
  } catch (e) {
    console.error("alerts route error:", e);
    res.status(500).json({ error: "internal error" });
  }
});

export default router;
