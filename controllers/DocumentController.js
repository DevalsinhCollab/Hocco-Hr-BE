const _ = require("lodash");
const EmpTemplate = require("../models/template");
const { default: axios } = require("axios");
const nodemailer = require("nodemailer");
const { checkSignedDocs, getDocketInfo } = require("./SignAgreementController");
const EmpSchema = require("../models/EmployeeModel");
const { base64ToS3 } = require("../utils/base64ToS3");

exports.getDocuments = async (req, res) => {
  const { page = 0, pageSize = 10, signStatus, status, employee, search } = req.query;
  const skip = page * pageSize;

  let findObject = {};
  if (search) {
    findObject.$or = [
      { empCode: { $regex: search.trim(), $options: "i" } },
      { signStatus: { $regex: search.trim(), $options: "i" } },
    ];
  }

  let empData;
  if (search) {
    empData = await EmpSchema.findOne({ name: { $regex: search.trim(), $options: "i" } })
  }

  if (empData) {
    findObject.$or = [
      { empCode: { $regex: empData.empCode.trim(), $options: "i" } },
    ];
  }

  const pipeline = [
    {
      $lookup: {
        from: "employees",
        localField: "empCode",
        foreignField: "empCode",
        as: "employeeData",
      },
    },
    {
      $unwind: {
        path: "$employeeData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        ...(signStatus ? { signStatus } : {}),
        ...(status ? { "employeeData.status": status } : {}),
        ...(employee ? { empCode: employee } : {}),
        ...findObject
      },
    },
    {
      $project: {
        empName: { $ifNull: ["$employeeData.name", ""] },
        empCode: { $ifNull: ["$employeeData.empCode", ""] },
        companyName: { $ifNull: ["$employeeData.companyName", ""] },
        status: { $ifNull: ["$employeeData.status", ""] },
        signStatus: { $ifNull: ["$employeeData.signStatus", ""] },
        signType: { $ifNull: ["$employeeData.signType", ""] },
        _id: 1,
        empCode: 1,
        signStatus: 1,
        document: 1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: 10,
    },
  ];

  const countPipeline = [
    {
      $lookup: {
        from: "employees",
        localField: "empCode",
        foreignField: "empCode",
        as: "employeeData",
      },
    },
    {
      $unwind: {
        path: "$employeeData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        ...(signStatus ? { signStatus } : {}),
        ...(status ? { "employeeData.status": status } : {}),
        ...(employee ? { empCode: employee } : {}),
        ...findObject
      },
    },
    {
      $count: "totalCount",
    },
  ];

  try {
    // Execute the aggregation pipeline with allowDiskUse for larger datasets
    const docData = await EmpTemplate.aggregate(pipeline).allowDiskUse(true);

    // Execute the count aggregation pipeline to get the total count
    const countResult = await EmpTemplate.aggregate(countPipeline).allowDiskUse(
      true
    );
    const docCount = countResult.length > 0 ? countResult[0].totalCount : 0;

    return res.status(200).json({
      data: docData,
      total: docCount,
      message: "Documents Data Get Successfully",
      error: false,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error fetching documents",
      error: true,
      details: err.message,
    });
  }
};

exports.createSignAgreementForEmployee = async (req, res) => {
  try {
    const { empCode } = req.body;

    const [findEmployeeData, base64Pdf] = await Promise.all([
      EmpSchema.findOne({ empCode }),
      EmpTemplate.findOne({ empCode }),
    ]);

    if (!findEmployeeData) {
      return res.status(404).json({
        message: "Employee not found",
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

    if (findEmployeeData && findEmployeeData.signType == "dsc") {
      signRequestPayload = {
        reference_id: randomNo,
        docket_title: `Agreement Invitation: ${findEmployeeData.name} (${empCode})`,
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
            signer_position: {
              appearance: [{ x1: 460, x2: 580, y1: 100, y2: 150 }],
            },
            signer_ref_id: "23654",
            signer_email: findEmployeeData.email || "",
            signer_name: findEmployeeData.name,
            sequence: "1",
            page_number: "all",
            esign_type: "otp",
            signer_mobile: findEmployeeData.phone || "",
            signer_remarks: "",
            authentication_mode: "mobile",
            signature_type: "electronic",
            trigger_esign_request: true,
            access_type: "otp",
          },
        ],
      };
    } else {
      signRequestPayload = {
        reference_id: randomNo,
        docket_title: `Agreement Invitation: ${findEmployeeData.name} (${empCode})`,
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
              appearance: [{ x1: 460, x2: 580, y1: 100, y2: 150 }],
            },
            signer_ref_id: "23654",
            signer_email: findEmployeeData?.email || "",
            signer_name: findEmployeeData?.name || "",
            sequence: "1",
            page_number: "all",
            esign_type: "otp",
            signer_mobile: findEmployeeData?.phone || "",
            signer_remarks: "",
            authentication_mode: "mobile",
            signer_validation_inputs: {
              year_of_birth: findEmployeeData.birth,
              gender: ["male"].includes(findEmployeeData.gender.toLowerCase())
                ? "M"
                : ["female"].includes(findEmployeeData.gender.toLowerCase())
                  ? "F"
                  : "O",
              name_as_per_aadhaar: findEmployeeData.name,
              last_four_digits_of_aadhaar:
                findEmployeeData?.adhar?.length === 3
                  ? "0" + findEmployeeData.adhar
                  : findEmployeeData.adhar,
            },
            signature_type: "aadhaar",
            access_type: "otp",
          },
        ],
      };
    }

    const response = await axios.post(
      `${process.env.SIGN_URL}/signRequest`,
      signRequestPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "x-parse-application-id": "collabsoftechpvt.ltd_esign_production",
          "x-parse-rest-api-key": "4174eee2c8d1cd2b89b8e8ddfd221211",
        },
      }
    );

    if (response.data && response.data.status === "success") {
      const buffer = Buffer.from(base64Pdf.document, "base64");

      // let docLink = await base64ToS3(base64Pdf.document, {
      //   _id: findEmployeeData._id,
      //   custCode: findEmployeeData.custCode,
      // });

      await Promise.all([
        EmpTemplate.updateOne(
          { empCode: findEmployeeData.empCode },
          {
            documentId: response.data.signer_info[0].document_id,
            docketId: response.data.docket_id,
            document: base64Pdf.document,
            signStatus: "Unsigned",
          }
        ),
        EmpSchema.updateOne(
          { empCode: findEmployeeData.empCode },
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
      if (findEmployeeData.cc?.length > 0) {
        mailOptions = {
          from: '"No Reply" <hr@hocco.in>',
          to: "hr@hocco.in",
          cc: findEmployeeData.cc?.length > 0 ? findEmployeeData.cc : [],
          subject: `Document for Signing ${findEmployeeData.name} (${empCode})`,
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
          subject: `Document for Signing ${findEmployeeData.name} (${empCode})`,
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

exports.checkPdfSignStatusEmployee = async (req, res) => {
  try {
    const docData = await EmpTemplate.find({ signStatus: "Unsigned" })
      .lean()
      .exec();

    let signedDocEmpArray = [];
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

        let base64Data = getNewBase64Data?.docket_Info[0].content;

        let docLink = await base64ToS3(base64Data, {
          _id: item._id,
          code: item.empCode,
        });

        let data = await EmpTemplate.findOneAndUpdate(
          { documentId: item.documentId },
          {
            document: docLink,
            signStatus: "Signed",
          }
        );

        await EmpSchema.updateOne(
          { empCode: data.empCode },
          {
            status: "Completed",
            signStatus: "Signed",
          },
          { new: true }
        );

        signedDocEmpArray.push(data.empCode);
      }
    }

    return res.status(200).json({
      message:
        signedDocEmpArray && signedDocEmpArray.length > 0
          ? `Document(s) signed by Employee(s):- ${signedDocEmpArray.join(
            ", "
          )}`
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

exports.updateSignAgreementForEmployee = async (req, res) => {
  try {
    const { empCode, fileName, document } = req.body;

    let data;
    let message;

    if (fileName == "" && document == "") {
      data = await EmpTemplate.findOneAndDelete({ empCode: empCode });
      message = "Document removed successfully";
    } else {
      data = await EmpTemplate.findOneAndUpdate(
        { empCode: empCode },
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
        message: "Employee not found",
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

exports.createMultiSignAgreementsForEmployees = async (req, res) => {
  try {
    const { employees } = req.body;

    const results = await Promise.all(
      employees.map(async (item) => {
        try {
          const findEmployee = await EmpSchema.findById(item);
          if (!findEmployee) {
            throw new Error(`Employee with id ${item} not found`);
          }

          const findEmployeeData = await EmpSchema.findOne({
            empCode: findEmployee.empCode,
          });
          if (!findEmployeeData) {
            throw new Error(
              `Employee data with empCode ${findEmployee.empCode} not found`
            );
          }

          const base64Pdf = await EmpTemplate.findOne({
            empCode: findEmployee.empCode,
          });
          if (!base64Pdf) {
            throw new Error(
              `PDF template with empCode ${findEmployee.empCode} not found`
            );
          }

          const randomNo = Math.ceil(Math.random() * 9999999999).toString();

          let signRequestPayload = {};

          if (findEmployeeData && findEmployeeData.signType == "dsc") {
            signRequestPayload = {
              reference_id: randomNo,
              docket_title: `Agreement Invitation: ${findEmployeeData.name} (${findEmployeeData.empCode})`,
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
                  signer_position: {
                    appearance: [{ x1: 460, x2: 580, y1: 100, y2: 150 }],
                  },
                  signer_ref_id: "23654",
                  signer_email: findEmployeeData.email || "",
                  signer_name: findEmployeeData.name,
                  sequence: "1",
                  page_number: "all",
                  esign_type: "otp",
                  signer_mobile: findEmployeeData.phone || "",
                  signer_remarks: "",
                  authentication_mode: "mobile",
                  signature_type: "electronic",
                  trigger_esign_request: true,
                  access_type: "otp",
                },
              ],
            };
          } else {
            signRequestPayload = {
              reference_id: randomNo,
              docket_title: `Agreement Invitation: ${findEmployeeData.name} (${findEmployeeData.empCode})`,
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
                    appearance: [{ x1: 460, x2: 580, y1: 100, y2: 150 }],
                  },
                  signer_ref_id: "23654",
                  signer_email:
                    findEmployeeData && findEmployeeData?.email
                      ? findEmployeeData?.email
                      : "",
                  signer_name: "Mitheeel",
                  sequence: "1",
                  page_number: "all",
                  esign_type: "otp",
                  signer_mobile:
                    findEmployeeData && findEmployeeData.phone
                      ? findEmployeeData?.phone
                      : "",
                  signer_remarks: "",
                  authentication_mode: "mobile",
                  signer_validation_inputs: {
                    year_of_birth: findEmployeeData.birth,
                    gender: ["male"].includes(
                      findEmployeeData.gender.toLowerCase()
                    )
                      ? "M"
                      : ["female"].includes(
                        findEmployeeData.gender.toLowerCase()
                      )
                        ? "F"
                        : "O",
                    name_as_per_aadhaar: findEmployeeData.name,
                    last_four_digits_of_aadhaar:
                      findEmployeeData &&
                        findEmployeeData.adhar &&
                        findEmployeeData.adhar.length == 3
                        ? "0" + findEmployeeData.adhar
                        : findEmployeeData.adhar,
                  },
                  signature_type: "aadhaar",
                  trigger_esign_request: true,
                  access_type: "otp",
                },
              ],
            };
          }

          const response = await axios.post(
            `${process.env.SIGN_URL}/signRequest`,
            signRequestPayload,
            {
              headers: {
                "Content-Type": "application/json",
                "x-parse-application-id":
                  "collabsoftechpvt.ltd_esign_production",
                "x-parse-rest-api-key": "4174eee2c8d1cd2b89b8e8ddfd221211",
              },
            }
          );

          if (response.data.status !== "success") {
            throw new Error(
              `In the document with empCode ${findEmployeeData.empCode} :- ${response.data.error}`
            );
          }

          const buffer = Buffer.from(base64Pdf.document, "base64");

          await EmpTemplate.updateOne(
            { empCode: findEmployeeData.empCode },
            {
              documentId: response.data.signer_info[0].document_id,
              docketId: response.data.docket_id,
            }
          );

          await EmpSchema.updateOne(
            { empCode: findEmployeeData.empCode },
            {
              $set: {
                status: "Sent",
                signStatus: "Unsigned",
              },
            },
            { new: true }
          );

          const transporter = nodemailer.createTransport({
            service: "Hotmail",
            auth: {
              user: process.env.HR_EMAIL,
              pass: process.env.HR_PASS,
            },
          });

          const mailOptions = {
            from: '"No Reply" <hr@hocco.in>',
            cc: findEmployeeData.cc.length > 0 ? findEmployeeData.cc : [],
            subject: `Document for Signing ${findEmployeeData.name} (${findEmployeeData.empCode})`,
            text: `Document attached here.`,
            attachments: [
              {
                filename: base64Pdf.fileName,
                content: buffer,
                contentType: "application/pdf",
              },
            ],
          };

          await transporter.sendMail(mailOptions);

          return { success: true, empCode: findEmployeeData.empCode };
        } catch (error) {
          throw error; // Propagate the error to the outer scope
        }
      })
    );

    return res
      .status(200)
      .json({ message: "Agreements Sent", success: true, data: results });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
