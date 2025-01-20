const express = require("express");
const { transferBase64ToAWS, transferBase64ToAWSForHr } = require("../controllers/TransferDataController");
const router = express.Router();

router.get("/transferBase64ToAWS/:count", transferBase64ToAWS);
router.get("/transferBase64ToAWSForHr/:count", transferBase64ToAWSForHr);

module.exports = router;