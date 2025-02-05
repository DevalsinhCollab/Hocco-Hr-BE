const express = require("express");
const {
  empDashboard,
  disDashboard,
} = require("../controllers/DashboardController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/empDashboard", empDashboard);
router.get("/disDashboard", disDashboard);

module.exports = router;
