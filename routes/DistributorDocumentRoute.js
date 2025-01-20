const express = require("express");
const {
  updateSignAgreementForDistributor,
  createSignAgreementForDistributor,
  getDistDocuments,
  checkPdfSignStatusDistributor,
  expiredDocuments,
  nearExpiryDocuments,
} = require("../controllers/DistributorDocumentController");

const router = express.Router();

router.post(
  "/createSignAgreementForDistributor",
  createSignAgreementForDistributor
);
router.get("/getDistDocuments", getDistDocuments);
router.post(
  "/updateSignAgreementForDistributor",
  updateSignAgreementForDistributor
);
router.get("/checkPdfSignStatusDistributor", checkPdfSignStatusDistributor);
router.get("/expiredDocuments", expiredDocuments);
router.get("/nearExpiryDocuments", nearExpiryDocuments);

module.exports = router;
