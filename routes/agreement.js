const express = require("express");
const {
  sendAadharLinkViaOtp,
  sendAllSignAgreement,
} = require("../controllers/agreement");

const router = express.Router();

router.post("/sendAadharLinkViaOtp", sendAadharLinkViaOtp);
router.get("/sendAllSignAgreement", sendAllSignAgreement);

module.exports = router;