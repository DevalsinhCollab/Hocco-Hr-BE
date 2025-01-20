const express = require("express");
const {
  createSignAgreementForEmployee,
  getDocuments,
  checkPdfSignStatusEmployee,
  updateSignAgreementForEmployee,
  createMultiSignAgreementsForEmployees,
} = require("../controllers/DocumentController");

const router = express.Router();

router.post("/createSignAgreementForEmployee", createSignAgreementForEmployee);
router.get("/getdocuments", getDocuments);
router.get("/checkPdfSignStatusEmployee", checkPdfSignStatusEmployee);
router.post("/updateSignAgreementForEmployee", updateSignAgreementForEmployee);
router.post("/createMultiSignAgreementsForEmployees", createMultiSignAgreementsForEmployees);

module.exports = router;
