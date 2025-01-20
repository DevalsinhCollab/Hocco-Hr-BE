const express = require("express");
const {
  createmulticustomer,
  createcustomer,
  getcustomers,
  updateCustomer,
  getCustomerById,
  deleteCustomer,
  getCustomerByCustCode,
  searchCustomers,
  getAllCustomersForExcel,
  searchByAsmName,
  searchByTsmName,
  updateSignedAndUnsignedPdf,
  getLatestCustomers,
} = require("../controllers/customer");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/createcustomer", createcustomer);
router.post("/createmulticustomer", createmulticustomer);
router.get("/getcustomers", authMiddleware, getcustomers);
router.post("/updateCustomer/:id", authMiddleware, updateCustomer);
router.get("/getCustomerById/:id", getCustomerById);
router.post("/deleteCustomer/:id", authMiddleware, deleteCustomer);
router.post("/getCustomerByCustCode", authMiddleware, getCustomerByCustCode);
router.post("/searchCustomers", authMiddleware, searchCustomers);
router.get("/getAllCustomersForExcel", authMiddleware, getAllCustomersForExcel);
router.post("/searchByAsmName", authMiddleware, searchByAsmName);
router.post("/searchByTsmName", authMiddleware, searchByTsmName);
router.post("/updateSignedAndUnsignedPdf", updateSignedAndUnsignedPdf);
router.get("/getLatestCustomers", authMiddleware, getLatestCustomers);

// router.get('/getuser/:userId', getuser);
// router.post('/updateuseragreement/:userId', updateuseragreement);
// router.post('/geteSignStatus/:userId/:document_id', geteSignStatus);

module.exports = router;
