const express = require("express");
const { getDashboardCount } = require("../controllers/dashboard");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.get("/getDashboardCount", authMiddleware, getDashboardCount);

module.exports = router;