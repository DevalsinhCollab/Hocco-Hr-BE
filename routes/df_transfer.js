const express = require("express");

const { dftransfer, releasedf } = require("../controllers/df_transfer");

const router = express.Router();

router.post("/dftransfer", dftransfer);
router.post("/releasedf", releasedf);

module.exports = router;
