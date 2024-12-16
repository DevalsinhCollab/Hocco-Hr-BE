const express = require("express");
const { createEmployee, getEmployees, deleteEmployee, updateEmployee, getEmployeesById, createmultiemployees, changeSignType, searchEmployees, handleEmployeeExcelDownload } = require("../controllers/employee");
const { authMiddleware } = require("../middleware/auth")
const router = express.Router();

router.post("/createEmployee", createEmployee);
router.get("/getEmployees", authMiddleware, getEmployees);
router.put("/deleteEmployee/:id", deleteEmployee);
router.put("/updateEmployee/:id", updateEmployee);
router.get("/getEmployeesById/:id", getEmployeesById);
router.post("/createmultiemployees", createmultiemployees);
router.put("/changeSignType/:id", changeSignType);
router.post("/searchEmployees", authMiddleware, searchEmployees);
router.post("/handleEmployeeExcelDownload", authMiddleware, handleEmployeeExcelDownload);

module.exports = router;