const express = require("express");
const { createSignAgreement, getDocuments, getLatestDocuments, getPendingDocuments } = require("../controllers/document");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/createSignAgreement", createSignAgreement);
router.get("/getDocuments", authMiddleware, getDocuments);
router.get("/getLatestDocuments", authMiddleware, getLatestDocuments);
router.get("/getPendingDocuments", authMiddleware, getPendingDocuments);

module.exports = router;