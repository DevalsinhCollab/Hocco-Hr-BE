const express = require("express");
const {
  createSignAgreementForVrs,
  updateSignAgreementForVrs,
} = require("../controllers/VrsDocumentController");

const router = express.Router();

router.post("/createSignAgreementForVrs", createSignAgreementForVrs);
router.post("/updateSignAgreementForVrs", updateSignAgreementForVrs);

module.exports = router;
