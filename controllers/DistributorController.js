const _ = require("lodash");
const bcrypt = require("bcrypt");
const DistributorSchema = require("../models/DistributorModel");
const DistributorTemplate = require("../models/DistributorTemplate");
const moment = require("moment");
const phoneNumberRegex = /^\d{10}$/;

exports.createmultidistributor = async (req, res) => {
  try {
    const oldUsers = await DistributorSchema.find({
      isDelete: "0",
      docType: "dis",
    })
      .lean()
      .exec();
    const reqBody = _.chunk(req.body, 100);

    // Helper function to pad adhar numbers with zeros
    const padAdharNumbers = (array) => {
      array.forEach((item) => {
        if (item.adhar && item.adhar.length < 4) {
          item.adhar = item.adhar.padStart(4, "0");
        }
      });
    };

    // Find duplicate employee codes within the request body
    const findDuplicateCustCodes = (array) => {
      const custCodeIndexes = {};
      const duplicates = new Set();

      array.forEach((chunk, chunkIndex) => {
        chunk.forEach((item, itemIndex) => {
          padAdharNumbers(chunk);

          const { custCode } = item;

          if (custCode == "") {
            return res.status(404).json({
              error: true,
              message: `Customer code empty in excel`,
            });
          }

          if (custCode !== "") {
            if (custCodeIndexes[custCode] !== undefined) {
              duplicates.add(custCodeIndexes[custCode]);
              duplicates.add(`${chunkIndex}-${itemIndex}`);
            } else {
              custCodeIndexes[custCode] = `${chunkIndex}-${itemIndex}`;
            }
          }
        });
      });

      return Array.from(duplicates);
    };

    const hasDuplicate = findDuplicateCustCodes(reqBody);

    if (hasDuplicate.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Duplicate custCode found on entries ${hasDuplicate.join(
          ", "
        )}`,
      });
    }

    const oldDistributorMap = new Map(
      oldUsers.map((user) => [user.custCode, user])
    );

    let newDistributor = [];
    let updatePromises = [];
    let invalidEntries = [];

    for (const chunk of reqBody) {
      for (const item of chunk) {
        // Validate phone number
        if (item.phone && !phoneNumberRegex.test(item.phone)) {
          invalidEntries.push({
            name: item.name,
            custCode: item.custCode,
          });
          continue; // Skip this item
        }

        const existingCustomers = oldDistributorMap.get(item.custCode);
        if (existingCustomers) {
          const updates = {};
          let needsUpdate = false;

          Object.keys(item).forEach((key) => {
            if (existingCustomers[key] !== item[key] && key !== "custCode") {
              updates[key] = item[key];
              needsUpdate = true;
            }
          });

          if (needsUpdate) {
            updatePromises.push(
              DistributorSchema.updateOne(
                { custCode: item.custCode, docType: "dis" },
                { $set: updates }
              ).exec()
            );
          }
        } else {
          let password = "123456";
          const salt = await bcrypt.genSalt(10);
          const newPass = await bcrypt.hash(password, salt);

          item.password = newPass;
          item.status = "Pending";
          item.isDelete = "0";
          item.docType = "dis";
          item.emailSent = false;

          item.startDate = moment(item.startDate, "DD-MM-YY").format(
            "DD/MM/YYYY"
          );
          item.endDate = moment(item.endDate, "DD-MM-YY").format("DD/MM/YYYY");

          newDistributor.push(item);
        }
      }
    }

    let invalidNumber = invalidEntries.map((item) => item.custCode);
    if (invalidEntries.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Customers with this custCode have invalid phone number ${invalidNumber.join(
          ", "
        )}`,
      });
    }

    if (newDistributor.length > 0) {
      await DistributorSchema.insertMany(newDistributor);
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    const getAllDistributor = await DistributorSchema.find({
      isDelete: "0",
      docType: "dis",
    })
      .lean()
      .exec();

    return res.status(200).json({
      error: false,
      message: "Distributor(s) added successfully",
      data: getAllDistributor,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getdistributors = async (req, res) => {
  try {
    const { status, signStatus, page = 0, pageSize = 10 } = req.query;

    const skip = page * pageSize;

    let findObject = { isDelete: "0", docType: "dis" };

    if (status !== "") {
      findObject.status = status;
    }

    if (signStatus !== "") {
      findObject.signStatus = signStatus;
    }

    const users = await DistributorSchema.find(findObject)
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    async function addDocs(data) {
      const promises = data.map(async (item) => {
        const findDoc = await DistributorTemplate.findOne({
          custCode: item.custCode,
          docType: "dis",
        })
          .lean()
          .exec();
        return {
          ...item,
          document: findDoc ? findDoc.document : "",
          fileName: findDoc ? findDoc.fileName : "",
        };
      });

      return Promise.all(promises);
    }

    const usersWithDocs = await addDocs(users);

    const total = await DistributorSchema.countDocuments(findObject);

    return res.status(200).json({
      data: usersWithDocs,
      total,
      message: "Distributor(s) Data Get Successfully",
      error: false,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.deleteDistributor = async (req, res) => {
  try {
    const { id } = req.params;

    let distributorData = await DistributorSchema.findByIdAndUpdate(
      id,
      { isDelete: 1 },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Distributor deleted successfully",
      data: distributorData,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.addDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { document, custCode, fileName } = req.body;

    let distributorData = await DistributorSchema.findByIdAndUpdate(
      id,
      { status: "Unsent" },
      { new: true }
    );

    await DistributorTemplate.create({
      document: document,
      custCode,
      fileName,
      signStatus: "Unsigned",
      docType: "dis",
    });

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      data: distributorData,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.updateDistributor = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, adhar, phone, birth, gender, name } = req.body;

    let data = {
      email,
      adhar,
      phone,
      birth,
      gender,
      name,
    };

    const updateDistributor = await DistributorSchema.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
      }
    );

    return res.status(200).json({
      message: "Distributor Updated",
      data: updateDistributor,
      success: true,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.handleDistributorExcelDownload = async (req, res) => {
  try {
    const { status, signStatus } = req.body;

    let findObject = { isDelete: "0", docType: "dis" };

    if (status !== "") {
      findObject.status = status;
    }

    if (signStatus !== "") {
      findObject.signStatus = signStatus;
    }

    const findDistributorData = await DistributorSchema.find(findObject)
      .lean()
      .exec();

    return res.status(200).json({
      error: false,
      message: "Excel downloaded successfully",
      data: findDistributorData,
    });
  } catch (error) {
    console.log(error, "handleDistributorExcelDownload error=====");
  }
};
