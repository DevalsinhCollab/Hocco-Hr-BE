const express = require("express");
const { createTemplateForHtml, getTemplates, searchTemplates } = require("../controllers/template");
const router = express.Router();

router.post("/createTemplateForHtml", createTemplateForHtml);
router.get("/getTemplates", getTemplates);
router.post("/searchTemplates", searchTemplates);

module.exports = router;