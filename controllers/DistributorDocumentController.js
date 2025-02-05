const DistributorDocument = require("../models/DistributorDocument");
const { default: axios } = require("axios");
const nodemailer = require("nodemailer");
const { checkSignedDocs, getDocketInfo } = require("./SignAgreementController");
const DistributorSchema = require("../models/DistributorModel");
const moment = require("moment");

exports.getDistDocuments = async (req, res) => {
  const { page = 0, pageSize = 10 } = req.query;
  const skip = page * pageSize;

  const docData = await DistributorDocument.find()
    .skip(skip)
    .limit(pageSize)
    .sort({ createdAt: -1 });

  async function addEmployee(data) {
    const promises = data.map(async (item) => {
      const findDoc = await DistributorSchema.findOne({
        custCode: item.custCode,
        docType: item.docType,
      })
        .lean()
        .exec();
      return {
        ...item.toObject(),
        custName: findDoc ? findDoc.name : "",
        status: findDoc ? findDoc.status : "",
        signStatus: findDoc ? findDoc.signStatus : "",
        custCode: findDoc ? findDoc.custCode : "",
      };
    });

    return Promise.all(promises);
  }

  const usersWithDocs = await addEmployee(docData);

  const docCount = await DistributorDocument.countDocuments();

  return res.status(200).json({
    data: usersWithDocs,
    total: docCount,
    message: "Documents Data Get Successfully",
    error: false,
  });
};

exports.createSignAgreementForDistributor = async (req, res) => {
  try {
    const { custCode } = req.body;

    const [findDistributorData, base64Pdf] = await Promise.all([
      DistributorSchema.findOne({ custCode, docType: "dis" }),
      DistributorDocument.findOne({ custCode, docType: "dis" }),
    ]);

    if (!findDistributorData) {
      return res.status(404).json({
        message: "Customer not found",
        success: false,
      });
    }

    if (!base64Pdf) {
      return res.status(404).json({
        message: "Template not found",
        success: false,
      });
    }

    const randomNo = Math.ceil(Math.random() * 9999999999).toString();

    let signRequestPayload = {};

    signRequestPayload = {
      reference_id: randomNo,
      docket_title: `Agreement Invitation: ${findDistributorData.name} (${custCode})`,
      documents: [
        {
          reference_doc_id: randomNo,
          content_type: "pdf",
          content: base64Pdf.document,
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
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
              { x1: 450, x2: 550, y1: 70, y2: 120 },
            ],
          },
          signer_ref_id: "23654",
          signer_email: findDistributorData?.email || "",
          signer_name: findDistributorData?.name || "",
          sequence: "1",
          page_number: "1,2,3,4,5,6,7,8,9,10,11,12,13,14,17,18",
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
        {
          document_to_be_signed: randomNo,
          trigger_esign_request: true,
          // signer_position: {
          //   appearance: [{ x1: 80, x2: 180, y1: 50, y2: 100 }],
          // },
          signer_position: {
            appearance: [
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
              { x1: 100, x2: 200, y1: 70, y2: 120 },
            ],
          },
          signer_ref_id: "23655",
          signer_email: "deval@collabsoftech.com.au",
          signer_name: "Zala Devalsinh Jayrajsinh",
          sequence: "2",
          page_number: "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15",
          esign_type: "otp",
          signer_mobile: "6353611517",
          signer_remarks: "",
          authentication_mode: "mobile",
          signer_validation_inputs: {
            year_of_birth: "2000",
            gender: "M",
            name_as_per_aadhaar: "Zala Devalsinh Jayrajsinh",
            last_four_digits_of_aadhaar: "9483",
          },
          signature_type: "aadhaar",
          access_type: "otp",
        },
      ],
    };

    const response = await axios.post(
      `https://uat.signdesk.in/api/sandbox/signRequest`,
      signRequestPayload,
      {
        headers: {
          "content-type": "application/json",
          "x-parse-application-id": "collabsoftechpvt.ltd_esign_uat",
          "x-parse-rest-api-key": "52fdfc072182654f163f5f0f9a621d72",
        },
      }
    );

    if (response.data && response.data.status === "success") {
      const buffer = Buffer.from(base64Pdf.document, "base64");

      await Promise.all([
        DistributorDocument.updateOne(
          { custCode: findDistributorData.custCode, docType: "dis" },
          {
            documentId: response.data.signer_info[0].document_id,
            docketId: response.data.docket_id,
            signStatus: "Unsigned",
          }
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
          text: "Document attached here.",
          attachments: [
            {
              filename: base64Pdf.fileName,
              content: buffer,
              contentType: "application/pdf",
            },
          ],
        };
      } else {
        mailOptions = {
          from: '"No Reply" <hr@hocco.in>',
          to: "hr@hocco.in",
          subject: `Document for Signing ${findDistributorData.name} (${custCode})`,
          text: "Document attached here.",
          attachments: [
            {
              filename: base64Pdf.fileName,
              content: buffer,
              contentType: "application/pdf",
            },
          ],
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
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", success: false });
  }
};

exports.checkPdfSignStatusDistributor = async (req, res) => {
  try {
    const docData = await DistributorDocument.find({ signStatus: "Unsigned" })
      .lean()
      .exec();

    let signedDocDistArray = [];
    for (const item of docData) {
      let checkSignStatus = await checkSignedDocs(item.documentId);

      if (
        checkSignStatus &&
        checkSignStatus &&
        checkSignStatus.signer_info &&
        checkSignStatus.signer_info[0] &&
        checkSignStatus.signer_info[0].status == "signed"
      ) {
        let getNewBase64Data = await getDocketInfo(
          item.documentId,
          item.docketId
        );

        let data = await DistributorDocument.findOneAndUpdate(
          { documentId: item.documentId },
          {
            document: getNewBase64Data?.docket_Info[0].content,
            signStatus: "Signed",
          }
        );

        await DistributorSchema.updateOne(
          { custCode: data.custCode, docType: data.docType },
          {
            status: "Completed",
            signStatus: "Signed",
          },
          { new: true }
        );

        signedDocDistArray.push(data.custCode);
      }
    }

    return res.status(200).json({
      message:
        signedDocDistArray && signedDocDistArray.length > 0
          ? `Document(s) signed by:- ${signedDocDistArray.join(", ")}`
          : "No updated documents",
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: true,
    });
  }
};

exports.updateSignAgreementForDistributor = async (req, res) => {
  try {
    const { custCode, fileName, document } = req.body;

    let data;
    let message;
    if (fileName == "" && document == "") {
      data = await DistributorDocument.findOneAndDelete({
        custCode: custCode,
        docType: "dis",
      });
      message = "Document removed successfully";
    } else {
      data = await DistributorDocument.findOneAndUpdate(
        { custCode: custCode, docType: "dis" },
        {
          $set: {
            fileName,
            document,
          },
        },
        { new: true }
      );
      message = "Document updated successfully";
    }

    if (!data) {
      return res.status(404).json({
        message: "Distributor not found",
        error: true,
      });
    }

    return res.status(200).json({
      data,
      message: message,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while updating the documents",
      error: true,
    });
  }
};

exports.expiredDocuments = async (req, res) => {
  try {
    const today = moment();

    let data = await DistributorSchema.find({});

    // Filter records where the endDate is less than today
    let expiredData = data.filter((item) => {
      let endDate = moment(item.endDate, "DD-MM-YY"); // Convert endDate to moment object
      return endDate.isBefore(today); // Compare if endDate is before today's date
    });

    async function addDocs(data) {
      const promises = data.map(async (item) => {
        const findDoc = await DistributorDocument.findOne({
          custCode: item.custCode,
          docType: "dis",
        })
          .lean()
          .exec();
        return {
          ...item.toObject(),
          document: findDoc ? findDoc.document : "",
          fileName: findDoc ? findDoc.fileName : "",
        };
      });

      return Promise.all(promises);
    }

    const usersWithDocs = await addDocs(expiredData);

    let totalCount = expiredData.length;

    return res.status(200).json({
      data: usersWithDocs,
      totalCount,
      message: "Expired data fetched successfully",
      error: false,
    });
  } catch (error) {
    console.log(error, "expiredDocuments error");
  }
};

exports.nearExpiryDocuments = async (req, res) => {
  try {
    const today = moment();
    const oneMonthFromNow = moment().add(1, "months");

    // Fetch all records
    let data = await DistributorSchema.find({});

    // Filter records where the endDate is within the next month
    let expiringSoonData = data.filter((item) => {
      let endDate = moment(item.endDate, "DD-MM-YY"); // Convert endDate to moment object
      return endDate.isAfter(today) && endDate.isBefore(oneMonthFromNow); // Check if endDate is within the next month
    });

    async function addDocs(data) {
      const promises = data.map(async (item) => {
        const findDoc = await DistributorDocument.findOne({
          custCode: item.custCode,
          docType: "dis",
        })
          .lean()
          .exec();
        return {
          ...item.toObject(),
          document: findDoc ? findDoc.document : "",
          fileName: findDoc ? findDoc.fileName : "",
        };
      });

      return Promise.all(promises);
    }

    const usersWithDocs = await addDocs(expiringSoonData);

    let totalCount = expiringSoonData.length;

    return res.status(200).json({
      data: usersWithDocs,
      totalCount,
      message: "Near Expiry data fetched successfully",
      error: false,
    });
  } catch (error) {
    console.log(error, "expiredDocuments error");
  }
};
