const _ = require("lodash");
const bcrypt = require("bcrypt");
const DistributorSchema = require("../models/DistributorModel");
const DistributorDocument = require("../models/DistributorDocument");
const moment = require("moment");
const phoneNumberRegex = /^\d{10}$/;
const { default: axios } = require("axios");
const { base64ToS3 } = require("../utils/base64ToS3");
const nodemailer = require("nodemailer");

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
    const { status, signStatus, page = 0, pageSize = 10, search } = req.query;

    const skip = page * pageSize;

    let findObject = { isDelete: "0", docType: "dis" };

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

    await DistributorDocument.create({
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
    const { status, signStatus, search } = req.body;

    let findObject = { isDelete: "0", docType: "dis" };

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
    console.log(error, "handleDistributorExcelDownload error=====");
  }
};

exports.createDocForSignDocuments = async (req, res) => {
  try {
    const { document, custCode, fileName, docType } = req.body;

    const response = await axios.post("http://13.126.84.122:8001/api/convertPdf", { base64Pdf: document });

    if (response && response.data && response.data.success) {
      const [findDistributorData] = await Promise.all([
        DistributorSchema.findOne({ custCode, docType: docType }),
      ]);

      if (!findDistributorData) {
        return res.status(404).json({
          message: "Customer not found",
          success: false,
        });
      }

      let distributorData = await DistributorSchema.findOneAndUpdate(
        { custCode: custCode, docType: docType },
        { status: "Unsent" },
        { new: true }
      );

      const randomNo = Math.ceil(Math.random() * 9999999999).toString();

      let signRequestPayload = {
        reference_id: randomNo,
        docket_title: `Agreement Invitation: ${findDistributorData.name} (${custCode})`,
        documents: [
          {
            reference_doc_id: randomNo,
            content_type: "pdf",
            content: response.data.data,
            signature_sequence: "sequential",
          },
        ],
        signers_info: [
          {
            document_to_be_signed: randomNo,
            trigger_esign_request: true,
            signer_position: {
              appearance: [
                { x1: 450, x2: 550, y1: 70, y2: 120 },
              ],
            },
            signer_ref_id: "23654",
            signer_email: findDistributorData?.email || "",
            signer_name: findDistributorData?.name || "",
            sequence: "1",
            page_number: "all",
            esign_type: "otp",
            signer_mobile: findDistributorData?.phone || "",
            signer_remarks: "",
            authentication_mode: "mobile",
            signer_validation_inputs: {
              year_of_birth: findDistributorData.birth,
              gender: ["male", "m"].includes(findDistributorData.gender.toLowerCase())
                ? "M"
                : ["female", "f"].includes(findDistributorData.gender.toLowerCase())
                  ? "F"
                  : "O",
              name_as_per_aadhaar: findDistributorData.name,
              last_four_digits_of_aadhaar:
                findDistributorData?.adhar?.length === 3
                  ? "0" + findDistributorData.adhar
                  : findDistributorData.adhar,
            },
            signature_type: "aadhaar",
            access_type: "otp",
          },
        ],
      };

      const responseSignDesk = await axios.post(
        `${process.env.SIGN_URL}/signRequest`,
        signRequestPayload,
        {
          headers: {
            "content-type": "application/json",
            "x-parse-application-id": process.env.APPLICATION_ID,
            "x-parse-rest-api-key": process.env.APPLICATION_KEY,
          },
        }
      );

      if (responseSignDesk.data && responseSignDesk.data.status === "success") {
        let docLink = await base64ToS3(response.data.data, { _id: findDistributorData._id, code: findDistributorData.custCode })

        await Promise.all([
          DistributorDocument.create(
            {
              custCode: findDistributorData.custCode, docType: docType,
              documentId: responseSignDesk.data.signer_info[0].document_id,
              docketId: responseSignDesk.data.docket_id,
              signStatus: "Unsigned",
              document: docLink,
              fileName: fileName
            },
          ),
          DistributorSchema.updateOne(
            { custCode: findDistributorData.custCode, docType: "dis" },
            {
              $set: {
                status: "Sent",
                signStatus: "Unsigned",
              },
            }
          ),
        ]);

        const transporter = nodemailer.createTransport({
          service: "Hotmail",
          auth: {
            user: process.env.HR_EMAIL,
            pass: process.env.HR_PASS,
          },
        });

        let mailOptions = {};
        if (findDistributorData.cc?.length > 0) {
          mailOptions = {
            from: '"No Reply" <hr@hocco.in>',
            to: "hr@hocco.in",
            cc: findDistributorData.cc?.length > 0 ? findDistributorData.cc : [],
            subject: `Document for Signing ${findDistributorData.name} (${custCode})`,
            text: `Document attached here ${docLink}`,
          };
        } else {
          mailOptions = {
            from: '"No Reply" <hr@hocco.in>',
            to: "hr@hocco.in",
            subject: `Document for Signing ${findDistributorData.name} (${custCode})`,
            text: `Document attached here ${docLink}`,
          };
        }

        transporter.sendMail(mailOptions, (err, data) => {
          if (err) {
            return res.status(400).json({ err, success: false });
          } else {
            return res.status(200).json({
              error: false,
              message: "Link sent to your Email-Id.",
              success: true,
            });
          }
        });
      } else {
        return res
          .status(400)
          .json({ message: response.data.error, success: false });
      }


      return res.status(200).json({
        success: true,
        message: "Document uploaded successfully",
        data: distributorData,
      });
    }

  } catch (error) {
    console.log(error);
  }
};

exports.searchDistributors = async (req, res) => {
  try {
    const { search, docType } = req.body;
    const limit = 5;

    // for searching
    let findObject = { docType: docType };
    if (search) {
      findObject.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { custCode: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const disData = await DistributorSchema.find(findObject)
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean()
      .exec();

    return res.status(200).json({
      error: false,
      data: disData,
    });
  } catch (error) {
    return res.status(400).json({ error: true, message: error.message });
  }
};