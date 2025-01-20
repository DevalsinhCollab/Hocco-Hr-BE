const express = require("express");
const {
  createChallan,
  getchallan,
  getchallanbyid,
  generateChallanPdf,
  generateEwayPdf,
} = require("../controllers/deliveryChallan");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.post("/createChallan", authMiddleware, createChallan);
router.post("/getChallan", authMiddleware, getchallan);
router.get("/getChallanbyid/:id", getchallanbyid);
router.get("/generateChallanPdf/:id", generateChallanPdf);
router.get("/generateEwayPdf/:id", generateEwayPdf);

module.exports = router;