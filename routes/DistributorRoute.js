const express = require("express");
const {
  createmultidistributor,
  getdistributors,
  deleteDistributor,
  addDoc,
  updateDistributor,
  handleDistributorExcelDownload,
  searchDistributors,
  createDocForSignDocuments,
} = require("../controllers/DistributorController");

const router = express.Router();

router.post("/createmultidistributor", createmultidistributor);
router.get("/getdistributors", getdistributors);
router.post("/deleteDistributor/:id", deleteDistributor);
router.put("/addDoc/:id", addDoc);
router.post("/updateDistributor/:id", updateDistributor);
router.post("/handleDistributorExcelDownload", handleDistributorExcelDownload);
router.post("/searchDistributors", searchDistributors);
router.post("/createDocForSignDocuments", createDocForSignDocuments);

module.exports = router;