const express = require("express");
const {
  createMultiAssets,
  getMultiAssets,
  updateAssetTrackerStatus,
  assetAgreement,
  assetRelease,
  getAssetsBySerialNumber,
  getAgreementByAssetId,
  getLatestAssetTracker,
} = require("../controllers/AssetTrackerController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/createMultiAssets", createMultiAssets);
router.get("/getMultiAssets", authMiddleware, getMultiAssets);
router.post("/assetAgreement", assetAgreement);
router.post("/assetRelease", authMiddleware, assetRelease);
router.get("/getAssetsBySerialNumber", authMiddleware, getAssetsBySerialNumber);
router.get("/getAgreementByAssetId/:id", authMiddleware, getAgreementByAssetId);
router.get("/getLatestAssetTracker", authMiddleware, getLatestAssetTracker);

module.exports = router;
