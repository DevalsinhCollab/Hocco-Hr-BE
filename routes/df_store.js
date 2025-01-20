const express = require("express");

const { addmultidfs, getdfstore } = require("../controllers/df_store");

const router = express.Router();

router.get("/getdfstore", getdfstore);
router.post("/addmultidfs", addmultidfs);

module.exports = router;
