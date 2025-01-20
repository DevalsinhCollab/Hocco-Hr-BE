const express = require("express");
const { createTemplateForHtml, searchTemplates, updateTemplate } = require("../controllers/template");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.post("/createTemplateForHtml", createTemplateForHtml);
router.post("/searchTemplates", authMiddleware, searchTemplates);
router.put("/updateTemplate/:id", updateTemplate);

module.exports = router;