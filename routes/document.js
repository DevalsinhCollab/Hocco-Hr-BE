const express = require("express");
const { createSignAgreement, getDocuments } = require("../controllers/document");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/createSignAgreement", createSignAgreement);
router.get("/getDocuments", authMiddleware, getDocuments);

module.exports = router;