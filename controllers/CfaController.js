const _ = require("lodash");
const bcrypt = require("bcrypt");
const DistributorSchema = require("../models/DistributorModel");
const DistributorDocument = require("../models/DistributorDocument");

const phoneNumberRegex = /^\d{10}$/;

exports.createmulticfa = async (req, res) => {
  try {
    const oldUsers = await DistributorSchema.find({
      isDelete: "0",
      docType: "cfa",
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

    const oldCfaMap = new Map(oldUsers.map((user) => [user.custCode, user]));

    let newCfa = [];
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

        const existingCustomers = oldCfaMap.get(item.custCode);
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
                { custCode: item.custCode, docType: "cfa" },
                { $set: updates }
              ).exec()
            );
          }
        } else {
          item.status = "Pending";
          item.isDelete = "0";
          item.docType = "cfa";
          item.emailSent = false;

          newCfa.push(item);
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

    if (newCfa.length > 0) {
      await DistributorSchema.insertMany(newCfa);
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    const getAllCfa = await DistributorSchema.find({
      isDelete: "0",
      docType: "cfa",
    })
      .lean()
      .exec();

    return res.status(200).json({
      error: false,
      message: "Cfa(s) added successfully",
      data: getAllCfa,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getcfas = async (req, res) => {
  try {
    const { status, signStatus, page = 0, pageSize = 10, search } = req.query;

    const skip = page * pageSize;

    let findObject = { isDelete: "0", docType: "cfa" };

    if (search) {
      findObject.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { custCode: { $regex: search.trim(), $options: "i" } },
        { status: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
        { adhar: { $regex: search.trim(), $options: "i" } },
        { birth: { $regex: search.trim(), $options: "i" } },
        { gender: { $regex: search.trim(), $options: "i" } },
        { signStatus: { $regex: search.trim(), $options: "i" } },
      ];
    }

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
        const findDoc = await DistributorDocument.findOne({
          custCode: item.custCode,
          docType: "cfa",
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
      message: "Cfa(s) Data Get Successfully",
      error: false,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.deleteCfa = async (req, res) => {
  try {
    const { id } = req.params;

    let cfaData = await DistributorSchema.findByIdAndUpdate(
      id,
      { isDelete: 1 },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Cfa deleted successfully",
      data: cfaData,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.addDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { document, custCode, fileName } = req.body;

    let cfaData = await DistributorSchema.findByIdAndUpdate(
      id,
      { status: "Unsent" },
      { new: true }
    );

    await DistributorDocument.create({
      document: document,
      custCode,
      fileName,
      signStatus: "Unsigned",
      docType: "cfa",
    });

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      data: cfaData,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.updateCfa = async (req, res) => {
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

    const cfaDistributor = await DistributorSchema.findByIdAndUpdate(id, data, {
      new: true,
    });

    return res.status(200).json({
      message: "Cfa Updated",
      data: cfaDistributor,
      success: true,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.handleCfaExcelDownload = async (req, res) => {
  try {
    const { status, signStatus, search } = req.body;

    let findObject = { isDelete: "0", docType: "cfa" };

    if (search) {
      findObject.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { custCode: { $regex: search.trim(), $options: "i" } },
        { status: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
        { adhar: { $regex: search.trim(), $options: "i" } },
        { birth: { $regex: search.trim(), $options: "i" } },
        { gender: { $regex: search.trim(), $options: "i" } },
        { signStatus: { $regex: search.trim(), $options: "i" } },
      ];
    }

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
    console.log(error, "handleCfaExcelDownload error=====");
  }
};
