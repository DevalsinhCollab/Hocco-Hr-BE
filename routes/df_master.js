const express = require("express");

const {
  addmultidfmaster,
  getdfmaster,
  getdfmasterbyId,
  updateDfMasterTrackingStatus,
  updateAsset,
  getDFByAssetSerialNumber,
  getAllAssetsForExcel,
  searchSerialNumberAndBarCode,
  getDFByCustCode,
} = require("../controllers/df_master");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.get("/getdfmaster", authMiddleware, getdfmaster);
router.post("/addmultidfmaster", addmultidfmaster);
router.get("/getdfmasterbyId/:id", getdfmasterbyId);
router.put("/updateDfMasterTrackingStatus/:id", updateDfMasterTrackingStatus);
router.post("/updateAsset/:id", updateAsset);
router.post("/getDFByAssetSerialNumber", getDFByAssetSerialNumber);
router.get("/getAllAssetsForExcel", authMiddleware, getAllAssetsForExcel);
router.post("/searchSerialNumberAndBarCode", authMiddleware, searchSerialNumberAndBarCode);
router.post("/getDFByCustCode", authMiddleware, getDFByCustCode);

module.exports = router;
