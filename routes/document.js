const express = require("express");
const { getDocuments, getLatestDocuments, getPendingDocuments, createSignAgreementForHr } = require("../controllers/document");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/createSignAgreementForHr", createSignAgreementForHr);
router.get("/getDocuments", authMiddleware, getDocuments);
router.get("/getLatestDocuments", authMiddleware, getLatestDocuments);
router.get("/getPendingDocuments", authMiddleware, getPendingDocuments);

module.exports = router;