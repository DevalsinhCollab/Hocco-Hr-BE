const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user")
const { default: axios } = require("axios");
const CompanySchema = require("../models/company")

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let checkUser = await User.findOne({
      email,
    });
    if (!checkUser) {
      return res
        .status(404)
        .json({ message: "Login with correct credentials", error: true });
    }

    const comparePass = await bcrypt.compare(password, checkUser.password);

    if (!comparePass) {
      return res
        .status(404)
        .json({ message: "Login with correct credentials", error: true });
    }

    const data = {
      user: checkUser._id,
    };

    if (checkUser && checkUser.userType && checkUser.userType.includes("HR")) {
      let company = await CompanySchema.find({}).sort({ createdAt: 1 }).limit(1)
      checkUser = await User.findByIdAndUpdate(checkUser._id, { company: company && company[0] && company[0]._id }, { new: true })
    }

    const token = JWT.sign(data, process.env.JWT_SECRET_KEY);

    return res.status(200).json({ token, data: checkUser });
  } catch (error) {
    console.log(error);
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const salt = await bcrypt.genSalt(10);
    const newPass = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: newPass,
      name,
    });

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.createMultiUsers = async (req, res) => {
  try {
    const user = User.insertMany(req.body);

    return res
      .status(200)
      .json({ error: false, message: "Customer created successfully.", user });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getusers = async (req, res) => {
  try {
    const users = await User.find({});
    return res.status(200).json(users);
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getuser = async (req, res) => {
  const { userId } = req.params;

  try {
    const users = await User.findById(userId);

    const data = {
      user: users._id,
    };

    const token = JWT.sign(data, process.env.JWT_SECRET);

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getuserbytoken = async (req, res) => {
  try {
    const { token } = req.body;

    var decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);

    const { user } = decoded;

    const userData = await User.findById(user).select("-password");

    return res.status(200).json({ error: false, data: userData });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { company } = req.body

    const userData = await User.findByIdAndUpdate(id, { company: company })

    return res.status(200).json({ error: false, data: userData, message: "User updated successfully" });

  } catch (error) {
    console.log(error, "update user error")
  }
}

exports.switchCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { userType } = req.body

    let userData = await User.findByIdAndUpdate(id, { userType: userType }, { new: true })

    if (userType && userType.includes("HR")) {
      let company = await CompanySchema.find({}).sort({ createdAt: 1 }).limit(1)

      userData = await User.findByIdAndUpdate(userData._id, { company: company[0]?._id }, { new: true })
    }

    return res.status(200).json({ error: false, data: userData, message: "Company Switched" });
  } catch (error) {
    console.log(error, "update user error")
  }
}