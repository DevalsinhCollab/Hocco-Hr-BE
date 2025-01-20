const express = require("express");
const {
  createTemplate,
  getTemplates,
  findVarFromTemplateById,
  createTemplateForHtml,
  htmlToPdf,
  getTemplateById,
} = require("../controllers/TemplateController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/createTemplate", createTemplate);
router.get("/getTemplates", authMiddleware, getTemplates);
router.get("/findvarfromtemplatebyid/:dId", findVarFromTemplateById);
router.post("/createTemplateForHtml", createTemplateForHtml);
router.post("/htmlToPdf", htmlToPdf);
router.get("/getTemplateById/:id", getTemplateById);

module.exports = router;
