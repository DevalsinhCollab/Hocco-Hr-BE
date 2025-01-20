const express = require("express");

const { createEwayBill } = require("../controllers/eWayBill");

const router = express.Router();

router.post("/createEWayBill", createEwayBill);

module.exports = router;
