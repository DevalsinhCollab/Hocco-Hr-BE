const EmployeeSchema = require("../models/employee")
const DocumentSchema = require("../models/document")
const UserSchema = require("../models/user")
const { base64ToS3 } = require("../utils/base64ToS3");
const { generateRandomSixDigit } = require("../utils/utils");
const { default: axios } = require("axios");
const { default: mongoose } = require("mongoose");
const { htmlToPdf } = require("./template");

exports.createSignAgreement = async (req, res) => {
    try {
        const {
            empName,
            empCode,
            document,
            fileName,
            signType,
            radioText
        } = req.body;

        const findEmployeeData = await EmployeeSchema.findOne({ empCode });
        const randomNo = Math.ceil(Math.random() * 9999999999).toString();

        let signRequestPayload = {};
        let documentData

        if (radioText == "document") {
            documentData = document

            if (signType == "dsc") {
                signRequestPayload = {
                    reference_id: randomNo,
                    docket_title: `Agreement Invitation: ${findEmployeeData.name} (${empCode})`,
                    documents: [
                        {
                            reference_doc_id: randomNo,
                            content_type: "pdf",
                            content: document,
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
                            content: document,
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
        } else {
            documentData = await htmlToPdf(req, res, findEmployeeData, document)

            if (signType == "dsc") {
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
                            content: documentData,
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

        }

        const response = await axios.post(
            `${process.env.SIGN_URL}/signRequest`,
            signRequestPayload,
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-parse-application-id": process.env.APPLICATION_ID,
                    "x-parse-rest-api-key": process.env.APPLICATION_KEY,
                },
            }
        );

        if (response.data.status != "failure") {
            const docLink = await base64ToS3(documentData, {
                _id: generateRandomSixDigit(),
                empCode:
                    findEmployeeData &&
                    findEmployeeData.empCode,
            });


            let finalData = {
                document: docLink,
                docketId: response.data.docket_id,
                documentId: response?.data?.document_id,
                empCode: empCode,
                fileName,
                company: new mongoose.Types.ObjectId(findEmployeeData.company),
                status: "Sent",
                empName: empName,
                signType: signType,
                signStatus: "Unsigned"
            };
            await DocumentSchema.create(finalData);
            return res.status(200).json({ data: finalData, success: true, message: "Document Uploaded And Sent Successfully" });
        } else {
            return res.status(400).json({ data: response.data, success: false });
        }
    } catch (error) {
        return res.status(400).json(error);
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