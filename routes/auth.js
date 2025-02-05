const express = require("express");
const {
  createUser,
  getusers,
  getuser,
  updateuseragreement,
  login,
  createMultiUsers,
  getuserbytoken,
  updateUser,
  switchCompany,
} = require("../controllers/auth");

const router = express.Router();

router.post("/createUser", createUser);
router.post("/createmultiusers", createMultiUsers);
router.post("/login", login);
router.get("/getusers", getusers);
router.get("/getuser/:userId", getuser);
router.post("/updateuseragreement/:userId", updateuseragreement);
router.post("/getuserbytoken", getuserbytoken);
router.put("/updateUser/:id", updateUser);
router.put("/switchCompany/:id", switchCompany);

module.exports = router;