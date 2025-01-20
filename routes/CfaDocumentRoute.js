const express = require("express");
const {
  createSignAgreementForCfa,
  updateSignAgreementForCfa,
} = require("../controllers/CfaDocumentController");

const router = express.Router();

router.post("/createSignAgreementForCfa", createSignAgreementForCfa);
router.post("/updateSignAgreementForCfa", updateSignAgreementForCfa);

module.exports = router;
