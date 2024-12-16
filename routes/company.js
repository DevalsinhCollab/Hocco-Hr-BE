const express = require("express");
const { createCompany, getCompanies } = require("../controllers/company");
const router = express.Router();

router.post("/createCompany", createCompany);
router.get("/getCompanies", getCompanies);

module.exports = router;