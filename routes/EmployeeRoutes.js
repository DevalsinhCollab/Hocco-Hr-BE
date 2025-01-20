const express = require("express");
const {
  createmultiemployees,
  getemployees,
  deleteEmployee,
  addDoc,
  updateEmployee,
  changeSignType,
  handleEmployeeExcelDownload,
  searchEmployees,
} = require("../controllers/EmployeeController");

const router = express.Router();

router.post("/createmultiemployees", createmultiemployees);
router.get("/getemployees", getemployees);
router.post("/deleteEmployee/:id", deleteEmployee);
router.put("/addDoc/:id", addDoc);
router.post("/updateEmployee/:id", updateEmployee);
router.post("/changesigntype/:id", changeSignType);
router.post("/handleEmployeeExcelDownload", handleEmployeeExcelDownload);
router.post("/searchEmployees", searchEmployees);

module.exports = router;
