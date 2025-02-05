const DistributorDocument = require("../models/DistributorDocument");
const DistributorSchema = require("../models/DistributorModel");
const { default: axios } = require("axios");
const nodemailer = require("nodemailer");

exports.createSignAgreementForVrs = async (req, res) => {
  try {
    const { custCode } = req.body;

    const [findCustomerData, base64Pdf] = await Promise.all([
      DistributorSchema.findOne({ custCode, docType: "vrs" }),
      DistributorDocument.findOne({ custCode, docType: "vrs" }),
    ]);

    if (!findCustomerData) {
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
      docket_title: `Agreement Invitation: ${findCustomerData.name} (${custCode})`,
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
            // appearance: [{ x1: 460, x2: 580, y1: 100, y2: 150 }],
            appearance: [{ x1: 200, x2: 300, y1: 50, y2: 100 }],
          },
          signer_ref_id: "23654",
          signer_email: findCustomerData?.email || "",
          signer_name: findCustomerData?.name || "",
          sequence: "1",
          page_number: "all",
          esign_type: "otp",
          signer_mobile: findCustomerData?.phone || "",
          signer_remarks: "",
          authentication_mode: "mobile",
          signer_validation_inputs: {
            year_of_birth: findCustomerData.birth,
            gender: ["male"].includes(findCustomerData.gender.toLowerCase())
              ? "M"
              : ["female"].includes(findCustomerData.gender.toLowerCase())
              ? "F"
              : "O",
            name_as_per_aadhaar: findCustomerData.name,
            last_four_digits_of_aadhaar:
              findCustomerData?.adhar?.length === 3
                ? "0" + findCustomerData.adhar
                : findCustomerData.adhar,
          },
          signature_type: "aadhaar",
          access_type: "otp",
        },
        {
          document_to_be_signed: randomNo,
          trigger_esign_request: true,
          signer_position: {
            appearance: [{ x1: 80, x2: 180, y1: 50, y2: 100 }],
          },
          signer_ref_id: "23655",
          signer_email: "deval@collabsoftech.com.au",
          signer_name: "Zala Devalsinh Jayrajsinh",
          sequence: "2",
          page_number: "all",
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
      `${process.env.SIGN_URL}/signRequest`,
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
          { custCode: findCustomerData.custCode, docType: "vrs" },
          {
            documentId: response.data.signer_info[0].document_id,
            docketId: response.data.docket_id,
            signStatus: "Unsigned",
          }
        ),
        DistributorSchema.updateOne(
          { custCode: findCustomerData.custCode, docType: "vrs" },
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
      if (findCustomerData.cc?.length > 0) {
        mailOptions = {
          from: '"No Reply" <hr@hocco.in>',
          to: "hr@hocco.in",
          cc: findCustomerData.cc?.length > 0 ? findCustomerData.cc : [],
          subject: `Document for Signing ${findCustomerData.name} (${custCode})`,
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
          subject: `Document for Signing ${findCustomerData.name} (${custCode})`,
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

exports.updateSignAgreementForVrs = async (req, res) => {
  try {
    const { custCode, fileName, document } = req.body;

    let data;
    let message;
    if (fileName == "" && document == "") {
      data = await DistributorDocument.findOneAndDelete({
        custCode: custCode,
        docType: "vrs",
      });
      message = "Document removed successfully";
    } else {
      data = await DistributorDocument.findOneAndUpdate(
        { custCode: custCode, docType: "vrs" },
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
