const express = require("express");
const { createTemplateForHtml, getTemplates, searchTemplates, getTemplateById, updateTemplate } = require("../controllers/template");
const { authMiddleware } = require("../middleware/auth");
const router = express.Router();

router.post("/createTemplateForHtml", createTemplateForHtml);
router.get("/getTemplates", authMiddleware, getTemplates);
router.post("/searchTemplates", authMiddleware, searchTemplates);
router.get("/getTemplateById/:id", getTemplateById);
router.put("/updateTemplate/:id", updateTemplate);

module.exports = router;