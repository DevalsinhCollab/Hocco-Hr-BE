const EmployeeSchema = require("../models/employee")
const DocumentSchema = require("../models/document")
const UserSchema = require("../models/user")
const { base64ToS3 } = require("../utils/base64ToS3");
const { generateRandomSixDigit } = require("../utils/utils");
const { default: axios } = require("axios");
const { default: mongoose } = require("mongoose");
const { htmlToPdf } = require("./template");

exports.createSignAgreementForHr = async (req, res) => {
    try {
        const { empName, empCode, document, fileName, signType, radioText } = req.body;

        // Find Employee Data
        const findEmployeeData = await EmployeeSchema.findOne({ empCode });
        if (!findEmployeeData) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        // Generate a random reference number
        const randomNo = Math.ceil(Math.random() * 9999999999).toString();

        let signRequestPayload = {};
        let documentData;

        // Handle document source (base64 PDF or HTML converted to PDF)
        if (radioText === "document") {
            documentData = document;
        } else {
            documentData = await htmlToPdf(req, res, findEmployeeData, document);
            if (!documentData) {
                return res.status(500).json({ success: false, message: "Failed to generate PDF from HTML" });
            }
        }

        // Prepare signRequestPayload based on signType
        const commonSignerInfo = {
            document_to_be_signed: randomNo,
            signer_position: { appearance: [{ x1: 460, x2: 580, y1: 100, y2: 150 }] },
            signer_ref_id: "23654",
            signer_email: findEmployeeData.email || "",
            signer_name: findEmployeeData.name || "",
            sequence: "1",
            page_number: "all",
            esign_type: "otp",
            signer_mobile: findEmployeeData.phone || "",
            signer_remarks: "",
            authentication_mode: "mobile",
            trigger_esign_request: true,
            access_type: "otp",
        };

        if (signType === "dsc") {
            commonSignerInfo.signature_type = "electronic";
        } else {
            commonSignerInfo.signature_type = "aadhaar";
            commonSignerInfo.signer_validation_inputs = {
                year_of_birth: findEmployeeData.birth,
                gender: ["male"].includes(findEmployeeData.gender?.toLowerCase()) ? "M" :
                    ["female"].includes(findEmployeeData.gender?.toLowerCase()) ? "F" : "O",
                name_as_per_aadhaar: findEmployeeData.name,
                last_four_digits_of_aadhaar: findEmployeeData?.adhar?.length === 3
                    ? "0" + findEmployeeData.adhar
                    : findEmployeeData.adhar,
            };
        }

        signRequestPayload = {
            reference_id: randomNo,
            docket_title: `Agreement Invitation: ${findEmployeeData.name} (${empCode})`,
            documents: [
                {
                    reference_doc_id: randomNo,
                    content_type: "pdf",
                    content: documentData,
                    signature_sequence: "sequential",
                },
            ],
            signers_info: [commonSignerInfo],
        };

        // Send request to signing API
        const response = await axios.post(`${process.env.SIGN_URL}/signRequest`, signRequestPayload, {
            headers: {
                "Content-Type": "application/json",
                "x-parse-application-id": process.env.APPLICATION_ID,
                "x-parse-rest-api-key": process.env.APPLICATION_KEY,
            },
        });

        if (response.data.status === "failure") {
            return res.status(400).json({ success: false, message: "Signing request failed", data: response.data });
        }

        // Upload document to S3
        const docLink = await base64ToS3(documentData, {
            _id: generateRandomSixDigit(),
            code: findEmployeeData.empCode,
        });

        if (!docLink) {
            return res.status(500).json({ success: false, message: "Failed to upload document to S3" });
        }

        // Save document details to database
        const finalData = {
            document: docLink,
            docketId: response.data.docket_id,
            documentId: response?.data?.document_id,
            empCode: empCode,
            fileName,
            company: new mongoose.Types.ObjectId(findEmployeeData.company),
            status: "Sent",
            empName,
            signType,
            signStatus: "Unsigned",
        };

        await DocumentSchema.create(finalData);

        return res.status(200).json({ success: true, message: "Document Uploaded And Sent Successfully", data: finalData });

    } catch (error) {
        console.error("Error in createSignAgreementForHr:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

exports.getDocuments = async (req, res) => {
    const { userId } = req
    const { page = 0, pageSize = 10, signStatus, status, employee, search, signType } = req.query;
    const skip = page * pageSize;

    const userData = await UserSchema.findById(userId)

    let findObject = { company: new mongoose.Types.ObjectId(userData.company) };
    if (search) {
        findObject.$or = [
            { empName: { $regex: search.trim(), $options: "i" } },
            { empCode: { $regex: search.trim(), $options: "i" } },
            { signStatus: { $regex: search.trim(), $options: "i" } },
        ];
    }

    if (signStatus) {
        findObject.signStatus = signStatus
    }

    if (status) {
        findObject.status = status
    }

    if (signType) {
        findObject.signType = signType
    }

    try {
        const docData = await DocumentSchema.find(findObject).populate("company").sort({ createdAt: -1 }).skip(skip).limit(pageSize)

        const countResult = await DocumentSchema.countDocuments(findObject)

        return res.status(200).json({
            data: docData,
            total: countResult,
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

exports.getLatestDocuments = async (req, res) => {
    try {
        const { userId } = req
        const {
            pageSize = 5,
        } = req.query;

        const userData = await UserSchema.findById(userId)

        let findObject = { company: new mongoose.Types.ObjectId(userData.company) };

        const data = await DocumentSchema.find(findObject)
            .sort({ createdAt: -1 })
            .populate("company")
            .limit(pageSize)
            .lean()
            .exec();

        return res.status(200).json({
            data: data,
            message: "Latest Documents fetched successfully",
            error: false,
        });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

exports.getPendingDocuments = async (req, res) => {
    try {
        const { userId } = req
        const {
            pageSize = 5,
        } = req.query;

        const userData = await UserSchema.findById(userId)

        let findObject = { signStatus: "Unsigned", company: new mongoose.Types.ObjectId(userData.company) };

        const data = await DocumentSchema.find(findObject)
            .sort({ createdAt: -1 })
            .populate("company")
            .limit(pageSize)
            .lean()
            .exec();

        return res.status(200).json({
            data: data,
            message: "Latest Documents fetched successfully",
            error: false,
        });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};