const AadharSchema = require("../models/AadharDataModel");
const CustomerSchema = require("../models/customer");
const SignAgreement = require("../models/SignAgreementModel");

exports.createAadharData = async (req, res) => {
  try {
    const { name, adhar, phone, gender, birth, custId, custCode } = req.body;

    const customerData = await CustomerSchema.find({ custCode });
    const checkCustCode = await AadharSchema.find({ custCode });

    // if (checkCustCode.length >= 1) {
    //   return res
    //     .status(400)
    //     .json({ error: "Aadhaar details already exist", success: false });
    // }

    // if (adhar !== customerData[0]?.adhar) {
    //   return res
    //     .status(400)
    //     .json({ error: "Aadhaar number does not match", success: false });
    // }

    const aadharData = await AadharSchema.create({
      name,
      adhar,
      phone,
      gender,
      custCode,
      custId,
      birth,
    });

    return res.status(200).json({ data: aadharData, success: true });
  } catch (error) {
    console.log(error, "Error in aadhar create");
  }
};

exports.getAadharData = async (req, res) => {
  try {
    const { page = 0, pageSize = 10, search } = req.body;

    let findObject = {};
    if (search) {
      findObject.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { adhar: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
        { birth: { $regex: search.trim(), $options: "i" } },
        { custCode: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = page * pageSize;
    const totalCount = await AadharSchema.countDocuments(findObject);
    const aadharData = await AadharSchema.find(findObject)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    return res.status(200).json({ data: aadharData, totalCount, success: true });
  } catch (error) {
    return res.status(500).json({ error: "Error fetching data", success: false });
  }
};

exports.getAllAdharDataForExcel = async (req, res) => {
  try {
    const { search } = req.body;

    let findObject = {};
    if (search) {
      findObject.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { adhar: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
        { birth: { $regex: search.trim(), $options: "i" } },
        { custCode: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const data = await AadharSchema.find(findObject).lean().exec();

    return res.status(200).json({ data: data, error: false });
  } catch (error) {
    console.log(error, "getAllAdharDataForExcel error========");
  }
};
