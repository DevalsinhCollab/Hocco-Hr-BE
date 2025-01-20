const express = require("express");
const { createmultivrs, getvrs, deleteVrs, addDoc, updateVrs, handleVrsExcelDownload } = require("../controllers/VrsController");

const router = express.Router();

router.post("/createmultivrs", createmultivrs);
router.get("/getvrs", getvrs);
router.post("/deleteVrs/:id", deleteVrs);
router.put("/addDoc/:id", addDoc);
router.post("/updateVrs/:id", updateVrs);
router.post("/handleVrsExcelDownload", handleVrsExcelDownload);

module.exports = router;