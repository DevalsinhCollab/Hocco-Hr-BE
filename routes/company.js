const express = require("express");
const { createCompany, getCompanies, getCompanyById } = require("../controllers/company");
const router = express.Router();

router.post("/createCompany", createCompany);
router.get("/getCompanies", getCompanies);
router.get("/getCompanyById/:id", getCompanyById);

module.exports = router;