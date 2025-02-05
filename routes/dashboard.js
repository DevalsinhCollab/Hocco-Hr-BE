const express = require("express");
const { getDashboardCount, dfDashboard, disDashboard } = require("../controllers/dashboard");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.get("/getDashboardCount", authMiddleware, getDashboardCount);
router.get("/dfDashboard", authMiddleware, dfDashboard);
router.get("/disDashboard", authMiddleware, disDashboard);

module.exports = router;