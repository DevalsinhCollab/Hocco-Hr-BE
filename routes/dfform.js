const express = require("express");

const { addmultidfform, getdfform } = require("../controllers/dfform.js");

const router = express.Router();

router.get("/getdfform", getdfform);
router.post("/addmultidfform", addmultidfform);

module.exports = router;
