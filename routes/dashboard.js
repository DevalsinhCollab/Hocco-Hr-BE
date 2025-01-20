const express = require("express");
const { getDashboardCount, dfDashboard } = require("../controllers/dashboard");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.get("/getDashboardCount", authMiddleware, getDashboardCount);
router.get("/dfDashboard", authMiddleware, dfDashboard);

module.exports = router;