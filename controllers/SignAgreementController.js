const axios = require("axios");
const DFMasterSchema = require("../models/df_master");
const CustomerSchema = require("../models/customer");
const TemplateSchema = require("../models/template");
const SignAgreementSchema = require("../models/SignAgreementModel");
const nodemailer = require("nodemailer");
const { base64ToS3 } = require("../utils/base64ToS3");
const { generateRandomSixDigit } = require("../utils/utils");

exports.createSignAgreement = async (req, res) => {
  try {
    const {
      assetsId,
      custCode,
      templateId,
      base64Pdf,
      custName,
      birth,
      gender,
      adhar,
    } = req.body;

    const findAssetData = await DFMasterSchema.findById(assetsId);
    const findCustomerData = await CustomerSchema.findOne({ custCode });
    const randomNo = Math.ceil(Math.random() * 9999999999).toString();

    // const response = await axios.post(
    //   `${process.env.SIGN_URL}/signRequest`,
    //   {
    //     reference_id: randomNo,
    //     docket_title: `Deep Freezer Agreement Invitation: ${custCode} - ${
    //       findCustomerData[0]?.custName
    //     } - ${findCustomerData[0]?.city ? findCustomerData[0]?.city : ""}`,
    //     documents: [
    //       {
    //         reference_doc_id: randomNo,
    //         content_type: "pdf",
    //         content: base64Pdf,
    //         signature_sequence: "sequential",
    //       },
    //     ],
    //     signers_info: [
    //       {
    //         document_to_be_signed: randomNo,
    //         trigger_esign_request: true,
    //         signer_position: {
    //           appearance: [
    //             {
    //               x1: 20,
    //               x2: 120,
    //               y1: 20,
    //               y2: 60,
    //             },
    //           ],
    //         },
    //         signer_ref_id: "23654",
    //         signer_email:
    //           findCustomerData && findCustomerData[0]
    //             ? findCustomerData[0]?.custEmailID
    //             : "",
    //         signer_name: "Mitheeel",
    //         sequence: "1",
    //         page_number: "all",
    //         esign_type: "otp",
    //         signer_mobile:
    //           findCustomerData && findCustomerData[0]
    //             ? findCustomerData[0]?.contactPersonMobile
    //             : "",
    //         signer_remarks: "",
    //         authentication_mode: "mobile",
    //         signer_validation_inputs: {
    //           year_of_birth: birth,
    //           gender: gender,
    //           name_as_per_aadhaar: custName,
    //           last_four_digits_of_aadhaar:
    //             adhar && adhar.length == 3 ? "0" + adhar : adhar,
    //         },
    //         signature_type: "aadhaar",
    //         trigger_esign_request: true,
    //         access_type: "otp",
    //       },
    //     ],
    //   },
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       "x-parse-application-id": "collabsoftechpvt.ltd_esign_production",
    //       "x-parse-rest-api-key": "4174eee2c8d1cd2b89b8e8ddfd221211",
    //     },
    //   }
    // );

    const response = await axios.post(
      `${process.env.SIGN_URL}/esign/request`,
      {
        "referenceId": randomNo,
        "documentInfo": {
          "name": "DF Agreements",
          "content": base64Pdf
        },
        "sequentialSigning": true,
        "userInfo": [
          {
            "name": custName,
            "emailId": findCustomerData && findCustomerData.custEmailID,
            "userType": "Signer",
            "signatureType": "Aadhaar",
            "aadhaarInfo": {
              "birthYear": birth,
              "lastFourDigitOfAadhaar": adhar && adhar.length == 3 ? "0" + adhar : adhar,
              "gender": ["male", "m"].includes(gender.toLowerCase())
                ? "M"
                : ["female", "f"].includes(gender.toLowerCase())
                  ? "F"
                  : "O"
            },
            "aadhaarOptions": {
              "otp": true,
              "biometricThumbScan": true,
              "irisScan": true,
              "face": true
            },
            "expiryDate": "",
            "emailReminderDays": "",
            "mobileNo": findCustomerData && findCustomerData.contactPersonMobile,
            "order": 1,
            "userReferenceId": randomNo,
            "signAppearance": 1,
            "pageToBeSigned": 1,
            "pageNumber": "1-2-3-4-5-6-7",
            "pageCoordinates": [
              {
                "pageNumber": 1,
                "pdfCoordinates": [
                  {
                    "x1": "40",
                    "x2": "300",
                    "y1": "720",
                    "y2": "50"
                  }
                ]
              },
              {
                "pageNumber": 2,
                "pdfCoordinates": [
                  {
                    "x1": "40",
                    "x2": "300",
                    "y1": "720",
                    "y2": "50"
                  }
                ]
              },
              {
                "pageNumber": 3,
                "pdfCoordinates": [
                  {
                    "x1": "40",
                    "x2": "300",
                    "y1": "720",
                    "y2": "50"
                  }
                ]
              },
              {
                "pageNumber": 4,
                "pdfCoordinates": [
                  {
                    "x1": "40",
                    "x2": "300",
                    "y1": "720",
                    "y2": "50"
                  }
                ]
              },
            ]
          }
        ],
        "descriptionForInvitee": "",
        "finalCopyRecipientsEmailId": "",
        "responseUrl": ""
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.API_KEY,
          "X-API-APP-ID": process.env.API_APP_ID,
        },
      }
    )

    if (response.data.status != "failure") {
      const docLink = await base64ToS3(base64Pdf, {
        _id: generateRandomSixDigit(),
        code:
          findCustomerData &&
          findCustomerData.custCode,
      });

      // let finalData = {
      //   documentBase64: docLink,
      //   templateId: templateId,
      //   assetsId,
      //   res_docket_id: response.data.docket_id,
      //   res_document_id: response?.data?.signer_info[0]?.document_id,
      //   res_signer_info: response.data.signer_info,
      //   res_resId: response.data.api_response_id,
      //   custCode: custCode,
      //   assetSerialNumber: findAssetData.assetSerialNumber,
      // };

      let finalData = {
        documentBase64: docLink,
        templateId: templateId,
        assetsId,
        res_reference_id: response && response.data && response.data.data && response.data.data.documentReferenceId,
        res_document_id: response && response.data && response.data.data && response.data.data.documentId,
        res_signer_info: response && response.data && response.data.data && response.data.data.userInfo,
        custCode: custCode,
        assetSerialNumber: findAssetData.assetSerialNumber,
      };
      await SignAgreementSchema.create(finalData);
      return res.status(200).json({ data: finalData, success: true });
    } else {
      return res.status(400).json({ data: response.data, success: false });
    }
  } catch (error) {
    console.log(error, "error-----------");
    
    return res.status(400).json(error);
  }
};

exports.checkSignedDocs = async (documentId, documentReferenceId) => {
  try {
    // "66e2adaddd7c76ea2ef8ed99"

    // const response = await axios.post(
    //   `${process.env.SIGN_URL}/getSignatureStatus`,
    //   { document_id: documentId },
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       "x-parse-application-id": "collabsoftechpvt.ltd_esign_production",
    //       "x-parse-rest-api-key": "4174eee2c8d1cd2b89b8e8ddfd221211",
    //     },
    //   }
    // );

    const response = await axios.post(
      `${process.env.SIGN_URL}/esign/status`,
      { documentId: documentId, documentReferenceId: documentReferenceId },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.API_KEY,
          "X-API-APP-ID": process.env.API_APP_ID,
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(`Error in checkSignedDocs: ${error.message}`);
  }
};

exports.getDocketInfo = async (documentId, docketId) => {
  try {
    const response = await axios.post(
      `${process.env.SIGN_URL}/getDocketInfo`,
      { document_id: documentId, docket_id: docketId },
      {
        headers: {
          "Content-Type": "application/json",
          "x-parse-application-id": "collabsoftechpvt.ltd_esign_production",
          "x-parse-rest-api-key": "4174eee2c8d1cd2b89b8e8ddfd221211",
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(`Error in getDocketInfo: ${error.message}`);
  }
};

exports.getAllAgreements = async (req, res) => {
  try {
    const skip = parseInt(req.query.skip, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 1000;

    const allAgreements = await SignAgreementSchema.find({})
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await SignAgreementSchema.countDocuments({});

    return res
      .status(200)
      .json({ data: allAgreements, total, message: "Done", success: true });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.changeBase64 = async (req, res) => {
  try {
    const { docketId, documentId, custCode } = req.body;

    let checkSignStatusData = await exports.checkSignedDocs(documentId);

    let newDataPdf;
    let changePdfBase64;
    if (
      checkSignStatusData &&
      checkSignStatusData.signer_info &&
      checkSignStatusData.signer_info[0] &&
      checkSignStatusData.signer_info[0].status &&
      checkSignStatusData.signer_info[0].status == "signed"
    ) {
      newDataPdf = await exports.getDocketInfo(documentId, docketId);

      let base64 =
        newDataPdf &&
        newDataPdf.docket_Info &&
        newDataPdf.docket_Info[0] &&
        newDataPdf.docket_Info[0].content;

      const docLink = await base64ToS3(base64, {
        _id: generateRandomSixDigit(),
        code: custCode,
      });

      changePdfBase64 = await SignAgreementSchema.findOneAndUpdate(
        { res_document_id: documentId, res_docket_id: docketId },
        { documentBase64: docLink, signStatus: "S" },
        { new: true }
      );
    } else {
      changePdfBase64 = await SignAgreementSchema.find({
        res_document_id: documentId,
        res_docket_id: docketId,
      });
    }

    return res.status(200).json({
      data: Array.isArray(changePdfBase64)
        ? changePdfBase64[0]
        : changePdfBase64,
      message: "Done",
      success: true,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.sendAgreementToAsmTsm = async (req, res) => {
  try {
    const { custCode, custName, base64Pdf } = req.body;

    const buffer = Buffer.from(base64Pdf, "base64");

    const findCustomer = await CustomerSchema.find({ custCode });

    const transporter = nodemailer.createTransport({
      service: "Hotmail",
      auth: {
        user: process.env.DF_EMAIL,
        pass: process.env.DF_PASS,
      },
    });

    let emailArray = [];

    if (findCustomer[0].asmEmail) {
      emailArray.push(findCustomer[0].asmEmail);
    }

    if (findCustomer[0].tsmVSEEmail) {
      emailArray.push(findCustomer[0].tsmVSEEmail);
    }

    let emails =
      emailArray && emailArray.length > 1
        ? emailArray.join(", ")
        : emailArray[0];

    const mailOptions = {
      from: '"No Reply" sales.report@hocco.in',
      to: emails,
      cc: "harsh.chovatiya@hocco.in",
      subject: `Invitation to sign - Deep Freezer Agreement: ${custCode} - ${findCustomer && findCustomer[0] && findCustomer[0]?.custName
        } - ${findCustomer && findCustomer[0] && findCustomer[0].city
          ? findCustomer[0].city
          : ""
        }`,
      text: `Agreement Generated for ${findCustomer && findCustomer[0] && findCustomer[0]?.custName
        }-${custCode}`,
      attachments: [
        {
          filename: "Agreement.pdf",
          content: buffer,
          contentType: "application/pdf",
        },
      ],
    };

    try {
      transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
          return res.status(400).json({ err, success: false });
        } else {
          return res.status(200).json({
            error: false,
            message: `Link sent to your Email-Id.`,
            success: true,
          });
        }
      });
    } catch (error) {
      return res.status(400).json({ error, success: false });
    }
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getAllAgreementsViaPagination = async (req, res) => {
  try {
    const { page = 0, pageSize = 10, search } = req.body;

    let findObject = {};
    if (search) {
      findObject.$or = [
        { custCode: { $regex: search.trim(), $options: "i" } },
        { assetSerialNumber: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = page * pageSize;
    const [totalCount, totalSignedCount, totalUnSignedCount] =
      await Promise.all([
        SignAgreementSchema.countDocuments(findObject),
        SignAgreementSchema.countDocuments({ signStatus: "S" }),
        SignAgreementSchema.countDocuments({ signStatus: "US" }),
      ]);

    const allAgreements = await SignAgreementSchema.find(findObject)
      .sort({ createdAt: -1 })
      // .select("-documentBase64")
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    async function addTemplateName(data) {
      const promises = [];

      data.forEach((item) => {
        const promise = Promise.all([
          TemplateSchema.findById(item.templateId),
          CustomerSchema.findOne({ custCode: item.custCode }),
        ]).then(([findTemp, findCust]) => {
          return {
            ...item,
            templateName: findTemp ? findTemp.templateName : "",
            customerName: findCust ? findCust.custName : "",
          };
        });

        promises.push(promise);
      });

      const result = await Promise.all(promises);
      return result;
    }

    // Example usage:
    addTemplateName(allAgreements).then(async (result) => {
      return res.status(200).json({
        data: result,
        totalCount,
        totalSignedCount,
        totalUnSignedCount,
        message: "Done",
        success: true,
      });
    });

    // return res.status(200).json({
    //   data: allAgreements,
    //   totalCount,
    //   totalSignedCount,
    //   totalUnSignedCount,
    //   message: "Done",
    //   success: true,
    // });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getAllUnSignAgreementForCron = async (req, res) => {
  try {
    // Find unsigned agreements
    let signedAgreement = await SignAgreementSchema.find().lean().exec();

    // Process each signed agreement sequentially
    for (let item of signedAgreement) {
      try {
        // Check signed documents
        let checkData = await exports.checkSignedDocs(
          item.res_document_id,
          item.res_docket_id
        );

        // Check if all signer info is signed
        let allSignedInfo =
          checkData &&
          checkData.signer_info &&
          checkData.signer_info !== undefined &&
          checkData.signer_info[0] &&
          checkData.signer_info[0].status;

        if (allSignedInfo == "signed") {
          // Get new base64 data for signed document
          let getNewBase64Data = await exports.getDocketInfo(
            item.res_document_id,
            item.res_docket_id
          );

          let base64Data =
            getNewBase64Data &&
            getNewBase64Data.docket_Info &&
            getNewBase64Data.docket_Info[0] &&
            getNewBase64Data.docket_Info[0].content;

          let docLink;

          if (base64Data && base64Data !== undefined) {
            docLink = await base64ToS3(base64Data, {
              _id: item._id,
              code: item && item.custCode,
            });
          } else {
            if (item.documentBase64 && typeof item.documentBase64 == "string") {
              docLink = await base64ToS3(item.documentBase64, {
                _id: item._id,
                code: item && item.custCode,
              });
            } else {
              docLink = item.documentBase64;
            }
          }

          // Update sign status and documentBase64
          await SignAgreementSchema.findByIdAndUpdate(
            item._id,
            {
              signStatus: "S",
              documentBase64: docLink,
            },
            { new: true }
          );
        }
      } catch (error) {
        console.error(
          `Error processing agreement with _id ${item._id}:`,
          error
        );
      }
    }

    // Respond with data after all agreements are processed
    return res
      .status(200)
      .json({ data: signedAgreement, message: "Done", success: true });
  } catch (error) {
    return res.status(400).json({ message: "Error processing request", error });
  }
};
exports.createSignAgreementForApp = async (req, res) => {
  try {
    const { custCode, assetSerialNumber } = req.body;

    const findAssetData = await DFMasterSchema.findOne({ assetSerialNumber });
    const findCustomerData = await CustomerSchema.findOne({ custCode });

    if (!findAssetData) {
      return res
        .status(404)
        .json({ message: "Asset not found", success: false });
    }

    if (!findCustomerData) {
      return res
        .status(404)
        .json({ message: "Customer not found", success: false });
    }

    const response = await axios.post(
      `${process.env.BACKEND_URL}/agreement/sendAadharLinkViaOtp`,
      {
        custId: findCustomerData._id,
        assetsId: findAssetData._id,
        radioText: "yes",
        template: "664af395133edc807152fc60",
      }
    );

    if (response && response.data && response.data.success) {
      return res
        .status(200)
        .json({ message: response.data.message, success: true });
    }

    // return res
    //   .status(400)
    //   .json({ message: 'Error in provided data', success: false });
  } catch (error) {
    return res.status(400).json({ error: true, message: error });
  }
};

exports.openDocument = async (req, res) => {
  try {
    const { custCode, assetSerialNumber, signStatus } = req.body;

    const data = await SignAgreementSchema.findOne({
      custCode: custCode,
      assetSerialNumber: assetSerialNumber,
      signStatus: signStatus,
    })
      .select("documentBase64")
      .lean()
      .exec();

    return res.status(200).json({ data, error: false });
  } catch (error) {
    console.log(error, "openDocument error========");
  }
};

// exports.getAllSignAgreementForExcel = async (req, res) => {
//   try {
//     const data = await SignAgreementSchema.find({})
//       .select("-documentBase64")
//       .lean()
//       .exec();

//     async function addTemplateName(data) {
//       const promises = [];

//       data.forEach((item) => {
//         const promise = Promise.all([
//           TemplateSchema.findById(item.templateId),
//           CustomerSchema.findOne({ custCode: item.custCode }),
//         ]).then(([findTemp, findCust]) => {
//           return {
//             ...item,
//             templateName: findTemp ? findTemp.templateName : "",
//             customerName: findCust ? findCust.custName : "",
//           };
//         });

//         promises.push(promise);
//       });

//       const result = await Promise.all(promises);
//       return result;
//     }

//     // Example usage:
//     addTemplateName(data).then(async (result) => {
//       return res.status(200).json({ data: result, error: false });
//     });
//   } catch (error) {
//     console.log(error, "openDocument error========");
//   }
// };

exports.getAllSignAgreementForExcel = async (req, res) => {
  try {
    const { search } = req.query;

    let findObject = {};

    if (search) {
      findObject.$or = [
        { custCode: { $regex: search.trim(), $options: "i" } },
        { assetSerialNumber: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const data = await SignAgreementSchema.aggregate([
      { $match: findObject },
      {
        $lookup: {
          from: "customers",
          localField: "custCode",
          foreignField: "custCode",
          as: "customerData",
        },
      },
      {
        $addFields: {
          custName: { $arrayElemAt: ["$customerData.custName", 0] },
        },
      },
      {
        $project: {
          assetSerialNumber: 1, // Include specific fields from SignAgreementSchema
          custCode: 1,
          signStatus: 1,
          custName: 1,
        },
      },
    ])
      .option({ allowDiskUse: true })
      .exec();

    return res.status(200).json({ data, error: false });
  } catch (error) {
    console.error(error, "openDocument error========");
    return res
      .status(500)
      .json({ error: true, message: "Internal Server Error" });
  }
};

// exports.getAllAgreementsForApp = async (req, res) => {
//   try {
//     const { page = 0, pageSize = 10 } = req.body;

//     const skip = page * pageSize;

//     const [totalCount, totalSignedCount, totalUnSignedCount] =
//       await Promise.all([
//         SignAgreementSchema.countDocuments(),
//         SignAgreementSchema.countDocuments({ signStatus: "S" }),
//         SignAgreementSchema.countDocuments({ signStatus: "US" }),
//       ]);

//     const allAgreements = await SignAgreementSchema.find({})
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(pageSize)
//       .lean()
//       .exec();

//     // Extracting templateIds and custCodes in one go
//     const templateIds = allAgreements.map((item) => item.templateId);
//     const custCodes = allAgreements.map((item) => item.custCode);

//     // Fetching all templates and customers in one query
//     const [templates, customers] = await Promise.all([
//       TemplateSchema.find({ _id: { $in: templateIds } }).lean(),
//       CustomerSchema.find({ custCode: { $in: custCodes } }).lean(),
//     ]);

//     // Creating a map for fast lookup
//     const templateMap = templates.reduce((map, template) => {
//       map[template._id] = template.templateName;
//       return map;
//     }, {});

//     const customerMap = customers.reduce((map, customer) => {
//       map[customer.custCode] = customer.custName;
//       return map;
//     }, {});

//     // Adding templateName and customerName to allAgreements
//     const result = allAgreements.map((item) => ({
//       ...item,
//       templateName: templateMap[item.templateId] || "",
//       customerName: customerMap[item.custCode] || "",
//     }));

//     return res.status(200).json({
//       data: result,
//       totalCount,
//       totalSignedCount,
//       totalUnSignedCount,
//       message: "Done",
//       success: true,
//     });
//   } catch (error) {
//     return res.status(400).json(error);
//   }
// };

exports.getAgreementByCustCodeAndAssetSerial = async (req, res) => {
  try {
    const { custCode, assetSerialNumber } = req.body;

    // Find agreement by custCode and assetSerialNumber
    const agreement = await SignAgreementSchema.findOne({
      custCode,
      assetSerialNumber,
      signStatus: "S"
    })
      .lean()
      .exec();

    if (!agreement) {
      return res.status(404).json({
        message: "Agreement not found",
        success: false,
      });
    }

    // Fetching the related template and customer
    const [template, customer] = await Promise.all([
      TemplateSchema.findOne({ _id: agreement.templateId }).lean(),
      CustomerSchema.findOne({ custCode: agreement.custCode }).lean(),
    ]);

    // Adding templateName and customerName to agreement
    const result = {
      ...agreement,
      templateName: template ? template.templateName : "",
      customerName: customer ? customer.custName : "",
    };

    return res.status(200).json({
      data: result,
      message: "Done",
      success: true,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.openDocumentAssestTracker = async (req, res) => {
  try {
    const { custCode, assetSerialNumber } = req.body;

    let endData;
    endData = await SignAgreementSchema.findOne({
      custCode: custCode,
      assetSerialNumber: assetSerialNumber,
    })
      .sort({
        updatedAt: -1, // Sort by updatedAt first (descending order)
        createdAt: -1, // If updatedAt is the same, sort by createdAt (descending order)
      })
      .lean()
      .exec();

    if (endData && endData.signStatus == "US") {
      try {
        let finalData = {
          docketId: endData.res_docket_id,
          documentId: endData.res_document_id,
          custCode,
        };

        endData = await axios.post(
          `${process.env.BACKEND_URL}/signAgreement/changeBase64`,
          finalData
        );
      } catch (error) {
        console.log(error, "Error in calling changeBase64 api");
      }
    }

    return res.status(200).json({
      data: endData && endData.data ? endData.data : endData,
      error: false,
    });
  } catch (error) {
    console.log(error, "openDocumentAssestTracker error========");
  }
};

const chunkArray = (array, chunkSize) => {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

exports.checkAllUnSignedDocs = async (req, res) => {
  try {
    let allData = await SignAgreementSchema.find({ signStatus: "US" });

    if (!allData.length) {
      return res.status(200).json({
        message: "No data available to update",
        success: true,
      });
    }

    // Chunk the data into smaller arrays of 10 items each
    const chunks = chunkArray(allData, 10);
    let updatedCount = 0;

    for (let chunk of chunks) {
      let promises = chunk.map(async (item) => {
        try {
          let sign = await exports.checkSignedDocs(item.res_document_id);

          if (
            sign &&
            sign.signer_info &&
            sign.signer_info[0] &&
            sign.signer_info[0].status == "signed"
          ) {
            let docInfo = await exports.getDocketInfo(
              item.res_document_id,
              item.res_docket_id
            );

            if (
              docInfo &&
              docInfo.docket_Info &&
              docInfo.docket_Info[0] &&
              docInfo.docket_Info[0].content
            ) {
              const docLink = await base64ToS3(docInfo.docket_Info[0].content, {
                _id: item?._id,
                code: item?.custCode,
              });

              const updatedAgreement =
                await SignAgreementSchema.findByIdAndUpdate(
                  item._id,
                  {
                    $set: {
                      documentBase64: docLink,
                      signStatus: "S",
                      isSigned: true,
                    },
                  },
                  { new: true }
                ).lean();

              updatedCount++; // Increment the counter when a document is updated

              console.log(
                `Signed agreement of ${updatedAgreement.custCode} with ${updatedAgreement.assetSerialNumber} updated`,
                "updatedAgreement========"
              );
            } else {
              console.log(
                `No valid content found in docket info for document ${item.res_document_id}`
              );
            }
          } else {
            console.log(
              `Document with ${item.custCode} and ${item.assetSerialNumber} not signed or signer info missing`
            );
          }
        } catch (err) {
          console.error(
            `Error processing document ${item.res_document_id}: ${err.message}`
          );
        }
      });

      // Wait for all promises in the current chunk to resolve
      await Promise.all(promises);
    }

    const finalMessage =
      updatedCount > 0 ? "Data updated successfully" : "No data updated";

    return res.status(200).json({
      message: finalMessage,
      success: true,
    });
  } catch (error) {
    console.log(error, "checkAllSignedDocs error========");
    return res.status(500).json({
      message: "An error occurred",
      success: false,
      error: error.message,
    });
  }
};
