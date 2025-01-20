const express = require("express");
const {
  createAadharData,
  getAadharData,
  getAllAdharDataForExcel,
} = require("../controllers/AadharController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/createAadharData", createAadharData);
router.post("/getAadharData", authMiddleware, getAadharData);
router.post("/getAllAdharDataForExcel", authMiddleware, getAllAdharDataForExcel);

module.exports = router;
