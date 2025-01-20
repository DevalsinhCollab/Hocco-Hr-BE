const express = require("express");
const { createmulticfa, getcfas, deleteCfa, addDoc, updateCfa, handleCfaExcelDownload } = require("../controllers/CfaController");


const router = express.Router();

router.post("/createmulticfa", createmulticfa);
router.get("/getcfas", getcfas);
router.post("/deleteCfa/:id", deleteCfa);
router.put("/addDoc/:id", addDoc);
router.post("/updateCfa/:id", updateCfa);
router.post("/handleCfaExcelDownload", handleCfaExcelDownload);

module.exports = router;