const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user")
const { default: axios } = require("axios");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const checkUser = await User.findOne({
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

    const token = JWT.sign(data, process.env.JWT_SECRET_KEY);

    const otherData = {
      _id: checkUser._id,
      name: checkUser.name,
      email: checkUser.email,
      company: checkUser.company,
      userType: checkUser.userType,
      createdAt: checkUser.createdAt,
      updatedAt: checkUser.updatedAt,
    };

    return res.status(200).json({ token, otherData });
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

exports.updateuseragreement = async (req, res) => {
  const { userId } = req.params;
  const agreementName = req.body[0];
  const eSignAPI = req.body[2].split("base64,")[1];
  const userData = req.body[1];

  let rendom = Math.floor(Math.random() * 1000 + 1);

  try {
    const eSign = await axios.post(
      `${process.env.SIGN_URL}/signRequest`,
      {
        reference_id: userData._id,
        docket_title: "TestSample",
        documents: [
          {
            reference_doc_id: userData._id,
            content_type: "pdf",
            content: eSignAPI,
            signature_sequence: "sequential",
          },
        ],
        signers_info: [
          {
            document_to_be_signed: userData._id,
            trigger_esign_request: true,
            signer_position: {
              appearance: [
                {
                  x1: 20,
                  x2: 120,
                  y1: 20,
                  y2: 60,
                },
              ],
            },
            signer_ref_id: userData._id,
            signer_email: userData["email"],
            signer_name: userData["ownerName"],
            sequence: "1",
            page_number: "1",
            esign_type: "otp",
            signer_mobile: userData["ownerContact"],
            signer_remarks: "eSign Document",
            authentication_mode: "email",
            signature_type: "electronic",
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-parse-application-id": process.env.APPLICATION_ID,
          "x-parse-rest-api-key": process.env.APPLICATION_KEY,
        },
      }
    );
    const docket_id = eSign["data"]["docket_id"];
    const document_id = eSign["data"]["signer_info"][0]["document_id"];
    // const agreementStatus = eSign['data']['status'];

    const user = await User.findByIdAndUpdate(userId, {
      agreementName,
      docket_id,
      document_id,
    });

    return res.status(200).json(user);
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