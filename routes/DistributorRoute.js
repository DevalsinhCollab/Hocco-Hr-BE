const express = require("express");
const {
  createmultidistributor,
  getdistributors,
  deleteDistributor,
  addDoc,
  updateDistributor,
  handleDistributorExcelDownload,
} = require("../controllers/DistributorController");

const router = express.Router();

router.post("/createmultidistributor", createmultidistributor);
router.get("/getdistributors", getdistributors);
router.post("/deleteDistributor/:id", deleteDistributor);
router.put("/addDoc/:id", addDoc);
router.post("/updateDistributor/:id", updateDistributor);
router.post("/handleDistributorExcelDownload", handleDistributorExcelDownload);

module.exports = router;