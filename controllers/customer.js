const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Customer = require("../models/customer");
const AssetTracker = require("../models/AssetTrackerModel");
const { default: axios } = require("axios");
const _ = require("lodash");
const AgreementSchema = require("../models/SignAgreementModel");

exports.createcustomer = async (req, res) => {
  try {
    const {
      status,
      custCode,
      custName,
      sdCode,
      sdName,
      addressDescription,
      custAddress,
      pinCode,
      city,
      stateCode,
      stateName,
      zone,
      country,
      wholesalerCode,
      wholesellerName,
      site,
      warehouse,
      priceGroup,
      createdDate,
      firstBillingDate,
      closingDate,
      custEmailID,
      contactPersonName,
      contactPersonMobile,
      custGroupCode,
      custGroupName,
      channelCode,
      channelName,
      subChannelCode,
      subChannelName,
      salesGroup,
      pan,
      adhar,
      gst,
      codeCreationEmpCode,
      rgmCode,
      rgmName,
      zmRSMCode,
      zmRSMName,
      asmCode,
      asmName,
      tsmVSECode,
      tsmVSEName,
      psr1Code,
      psr1Name,
      psr2Code,
      psr2Name,
      nationalHeadCode,
      nationalHeadName,
      kamCode,
      kamName,
      kaeCode,
      kaeName,
      tsmVSEEmail,
      asmEmail,
      birthYear,
      gender,
      rsmCode,
      rsmName,
      adharName,
    } = req.body;

    const user = new Customer({
      status,
      custCode,
      custName,
      sdCode,
      sdName,
      addressDescription,
      custAddress,
      pinCode,
      city,
      stateCode,
      stateName,
      zone,
      country,
      wholesalerCode,
      wholesellerName,
      site,
      warehouse,
      priceGroup,
      createdDate,
      firstBillingDate,
      closingDate,
      custEmailID,
      contactPersonName,
      contactPersonMobile,
      custGroupCode,
      custGroupName,
      channelCode,
      channelName,
      subChannelCode,
      subChannelName,
      salesGroup,
      pan,
      adhar,
      gst,
      codeCreationEmpCode,
      rgmCode,
      rgmName,
      zmRSMCode,
      zmRSMName,
      asmCode,
      asmName,
      tsmVSECode,
      tsmVSEName,
      psr1Code,
      psr1Name,
      psr2Code,
      psr2Name,
      nationalHeadCode,
      nationalHeadName,
      kamCode,
      kamName,
      kaeCode,
      kaeName,
      tsmVSEEmail,
      asmEmail,
      birthYear,
      gender,
      rsmCode,
      rsmName,
      adharName,
    });

    const usersaved = await user.save();

    const data = {
      user: usersaved._id,
    };

    const token = JWT.sign(data, process.env.JWT_SECRET);

    return res.status(200).json({ token, user });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.createmulticustomer = async (req, res) => {
  try {
    const oldUsers = await Customer.find({}).lean().exec();
    const reqBody = _.chunk(req.body, 100);

    // Helper function to pad adhar numbers with zeros
    const padAdharNumbers = (array) => {
      array.forEach((item) => {
        if (item.adhar && item.adhar.length < 4) {
          item.adhar = item.adhar.padStart(4, "0");
        }
      });
    };

    // Find duplicate customer codes within the request body
    const findDuplicateCustCodes = (array) => {
      const custCodeIndexes = {};
      const duplicates = new Set();

      array.forEach((chunk, chunkIndex) => {
        chunk.forEach((item, itemIndex) => {
          padAdharNumbers(chunk);

          const { custCode } = item;
          if (custCodeIndexes[custCode] !== undefined) {
            duplicates.add(custCodeIndexes[custCode]);
            duplicates.add(`${chunkIndex}-${itemIndex}`);
          } else {
            custCodeIndexes[custCode] = `${chunkIndex}-${itemIndex}`;
          }
        });
      });

      return Array.from(duplicates);
    };

    const hasDuplicate = findDuplicateCustCodes(reqBody);

    //if (hasDuplicate.length > 0) {
    //return res.status(400).json({
    //error: `Duplicate custCode found on entries ${hasDuplicate.join(", ")}`,
    //});
    //}

    const oldCustomerMap = new Map(
      oldUsers.map((user) => [user.custCode, user])
    );

    let newCustomers = [];
    let updatePromises = [];

    reqBody.forEach((chunk) => {
      chunk.forEach(async (item) => {
        const existingCustomer = oldCustomerMap.get(item.custCode);
        if (existingCustomer) {
          const updates = {};
          let needsUpdate = false;

          Object.keys(item).forEach((key) => {
            if (existingCustomer[key] !== item[key] && key !== "custCode") {
              updates[key] = item[key];
              needsUpdate = true;
            }
          });

          if (needsUpdate) {
            updatePromises.push(
              await Customer.updateOne(
                { custCode: item.custCode },
                { $set: updates }
              ).exec()
            );
          }
        } else {
          item.isDelete = 0;
          newCustomers.push(item);
        }
      });
    });

    if (newCustomers.length > 0) {
      await Customer.insertMany(newCustomers);
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    const getAllCustomer = await Customer.find({}).lean().exec();
    return res.status(200).json({
      error: "Customer Added/Updated Successfully",
      data: getAllCustomer,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getcustomers = async (req, res) => {
  try {
    const { page = 0, pageSize = 10, customer, search } = req.query;

    let findObject = {};

    if (search) {
      findObject.$or = [
        { custName: { $regex: search.trim(), $options: "i" } },
        { custCode: { $regex: search.trim(), $options: "i" } },
        { stateName: { $regex: search.trim(), $options: "i" } },
        { stateCode: { $regex: search.trim(), $options: "i" } },
        { pinCode: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (customer) {
      findObject._id = customer;
    }

    const skip = page * pageSize;

    const users = await Customer.find(findObject)
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();
    const total = await Customer.countDocuments({});

    return res.status(200).json({ data: users, totalCount: total });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { custName, custEmailID, adhar, contactPersonMobile, gender } =
      req.body;

    let data = {
      custName,
      custEmailID,
      adhar,
      contactPersonMobile,
      gender,
    };

    const updateCustomer = await Customer.findByIdAndUpdate(id, data, {
      new: true,
    });

    return res.status(200).json({
      message: "Customer Updated",
      data: updateCustomer,
      success: true,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    let customerData = await Customer.findById(id).lean().exec();

    return res.status(200).json({ success: true, data: customerData });
  } catch (error) {
    console.log(error);
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    let customerData = await Customer.findByIdAndUpdate(
      id,
      { isDelete: 1 },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: customerData,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getCustomerByCustCode = async (req, res) => {
  try {
    const { custCode } = req.body;
    const customer = await Customer.findOne({ custCode }).lean().exec();

    return res.status(200).json({ data: customer, error: false });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.searchCustomers = async (req, res) => {
  try {
    const { search } = req.body;
    const limit = 5;

    // for searching
    let findObject = {};
    if (search) {
      findObject.$or = [
        { custName: { $regex: search.trim(), $options: "i" } },
        { custCode: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const customersData = await Customer.find(findObject)
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean()
      .exec();

    return res.status(200).json({
      error: false,
      data: customersData,
    });
  } catch (error) {
    return res.status(400).json({ error: true, message: error.message });
  }
};

exports.getAllCustomersForExcel = async (req, res) => {
  try {
    const { customer } = req.query;

    let findObject = {};
    if (customer) {
      findObject._id = customer;
    }

    const data = await Customer.find(findObject).lean().exec();

    // Example usage:
    return res.status(200).json({ data: data, error: false });
  } catch (error) {
    console.log(error, "getAllCustomersForExcel error========");
  }
};

exports.searchByAsmName = async (req, res) => {
  try {
    const { search } = req.body;
    const limit = 5;

    // Build the match stage for the aggregation pipeline
    let matchStage = { asmName: { $exists: true } };
    if (search) {
      matchStage.asmName = { $regex: search.trim(), $options: "i" };
    }

    const customersData = await Customer.aggregate([
      { $match: matchStage }, // Match documents with asmName that meets the search criteria
      {
        $group: {
          _id: "$asmName", // Group by asmName to remove duplicates
          asmName: { $first: "$asmName" },
          createdAt: { $first: "$createdAt" }, // Retain the first createdAt value for sorting
        },
      },
      { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
      { $limit: limit }, // Limit the results to the specified limit
    ])
      .option({ allowDiskUse: true })
      .exec();

    return res.status(200).json({
      error: false,
      data: customersData, // Returns unique asmName entries
    });
  } catch (error) {
    return res.status(400).json({ error: true, message: error.message });
  }
};

exports.searchByTsmName = async (req, res) => {
  try {
    const { search } = req.body;
    const limit = 5;

    // Build the match stage for the aggregation pipeline
    let matchStage = { tsmVSEName: { $exists: true } };
    if (search) {
      matchStage.tsmVSEName = { $regex: search.trim(), $options: "i" };
    }

    const customersData = await Customer.aggregate([
      { $match: matchStage }, // Match documents with tsmVSEName that meets the search criteria
      {
        $group: {
          _id: "$tsmVSEName", // Group by tsmVSEName to remove duplicates
          tsmVSEName: { $first: "$tsmVSEName" },
          createdAt: { $first: "$createdAt" }, // Retain the first createdAt value for sorting
        },
      },
      { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
      { $limit: limit }, // Limit the results to the specified limit
    ])
      .option({ allowDiskUse: true })
      .exec();

    return res.status(200).json({
      error: false,
      data: customersData, // Returns unique tsmVSEName entries
    });
  } catch (error) {
    return res.status(400).json({ error: true, message: error.message });
  }
};

exports.updateSignedAndUnsignedPdf = async (req, res) => {
  try {
    const pageSize = 10;
    const totalDocs = await AgreementSchema.countDocuments({ signStatus: "S" });

    for (let skip = 0; skip < totalDocs; skip += pageSize) {
      const agreeData = await AgreementSchema.find({ signStatus: "S" })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec();

      // Process each chunk of agreements
      for (const item of agreeData) {
        let checkSign = await checkSignedDocs(item.res_document_id);

        let status =
          checkSign &&
          checkSign.signer_info &&
          checkSign.signer_info[0] &&
          checkSign.signer_info[0].status;

        let checkPdfData = await getDocketInfo(
          item.res_document_id,
          item.res_docket_id
        );

        let base64 =
          checkPdfData &&
          checkPdfData.docket_Info &&
          checkPdfData.docket_Info[0] &&
          checkPdfData.docket_Info[0].content;

        if (base64 !== undefined) {
          let docLink = await base64ToS3(base64, {
            _id: item._id,
            code: item.custCode,
          });

          let updatedData = await AgreementSchema.findByIdAndUpdate(
            { _id: item._id },
            {
              signStatus: status === "signed" ? "S" : "US",
              documentBase64: docLink,
            },
            { new: true }
          );

          console.log(
            `Agreement with ${updatedData.custCode} and ${updatedData.assetSerialNumber} was updated to status ${updatedData.signStatus}`
          );
        }
      }
    }

    return res
      .status(200)
      .json({ message: "Agreements processed successfully" });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getLatestCustomers = async (req, res) => {
  try {
    let limit = 5

    const customers = await Customer.find({}).select("custName custCode createdAt")

      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();


    return res.status(200).json({
      data: customers,
      message: "Latest Customers Data Get Successfully",
      error: false,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};