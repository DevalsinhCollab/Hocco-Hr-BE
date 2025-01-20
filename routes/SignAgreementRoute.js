const express = require("express");
const {
  createSignAgreement,
  getAllUnSignAgreement,
  getAllAgreements,
  changeBase64,
  sendAgreementToAsmTsm,
  getAllAgreementsViaPagination,
  createSignAgreementForApp,
  openDocument,
  getAllSignAgreementForExcel,
  checkSignedDocs,
  openDocumentAssestTracker,
  getAgreementByCustCodeAndAssetSerial,
  checkAllUnSignedDocs,
  getAllUnSignAgreementForCron,
} = require("../controllers/SignAgreementController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/createSignAgreement", createSignAgreement);
router.get("/getAllUnSignAgreement", getAllUnSignAgreement);
router.get("/getAllAgreements", getAllAgreements);
router.post("/changeBase64", changeBase64);
router.post("/sendAgreementToAsmTsm", sendAgreementToAsmTsm);
router.post(
  "/getAllAgreementsViaPagination",
  authMiddleware,
  getAllAgreementsViaPagination
);
router.post("/createSignAgreementForApp", createSignAgreementForApp);
router.post("/getAllAgreementsForApp", getAgreementByCustCodeAndAssetSerial);
router.post("/openDocument", authMiddleware, openDocument);
router.post("/openDocumentAssestTracker", authMiddleware, openDocumentAssestTracker);
router.get(
  "/getAllSignAgreementForExcel",
  authMiddleware,
  getAllSignAgreementForExcel
);
router.post("/checkSignedDocs", checkSignedDocs);
router.get("/checkAllUnSignedDocs", checkAllUnSignedDocs);
router.get("/getAllUnSignAgreementForCron", getAllUnSignAgreementForCron);

module.exports = router;
