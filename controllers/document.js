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

        if (signType === "dsc") {
            signRequestPayload = {
                "referenceId": randomNo,
                "documentInfo": {
                    "name": `Agreement Invitation`,
                    "content": documentData
                },
                "sequentialSigning": true,
                "userInfo": [
                    {
                        "name": findEmployeeData && findEmployeeData.name,
                        "emailId": findEmployeeData && findEmployeeData.email,
                        "userType": "Signer",
                        "signatureType": "Electronic",
                        "electronicOptions": {
                            "canDraw": true,
                            "canType": true,
                            "canUpload": true,
                            "captureGPSLocation": true,
                            "capturePhoto": true
                        },
                        "expiryDate": "",
                        "emailReminderDays": "",
                        "mobileNo": findEmployeeData && findEmployeeData.phone,
                        "order": 1,
                        "userReferenceId": randomNo,
                        "signAppearance": 1,
                        "pageToBeSigned": 1,
                        "pageNumber": "1-2-3-4-5-6-7-8-9-10-11-12",
                        "pageCoordinates": [
                            {
                                "pageNumber": 1,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 2,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 3,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 4,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 5,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 6,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 7,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 8,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 9,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 10,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 11,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
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
            }
        } else {
            signRequestPayload = {
                "referenceId": randomNo,
                "documentInfo": {
                    "name": `Agreement Invitation`,
                    "content": documentData
                },
                "sequentialSigning": true,
                "userInfo": [
                    {
                        "name": findEmployeeData && findEmployeeData.name,
                        "emailId": findEmployeeData && findEmployeeData.email,
                        "userType": "Signer",
                        "signatureType": "Aadhaar",
                        "aadhaarInfo": {
                            "birthYear": findEmployeeData && findEmployeeData.birth,
                            "lastFourDigitOfAadhaar": findEmployeeData && findEmployeeData.adhar,
                            "gender": ["male", "m"].includes(findEmployeeData.gender.toLowerCase())
                                ? "M"
                                : ["female", "f"].includes(findEmployeeData.gender.toLowerCase())
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
                        "mobileNo": findEmployeeData && findEmployeeData.phone,
                        "order": 1,
                        "userReferenceId": randomNo,
                        "signAppearance": 1,
                        "pageToBeSigned": 1,
                        "pageNumber": "1-2-3-4-5-6-7-8-9-10-11-12",
                        "pageCoordinates": [
                            {
                                "pageNumber": 1,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 2,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 3,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 4,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 5,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 6,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 7,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 8,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 9,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 10,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
                                        "y2": "50"
                                    }
                                ]
                            },
                            {
                                "pageNumber": 11,
                                "pdfCoordinates": [
                                    {
                                        "x1": "420",
                                        "x2": "300",
                                        "y1": "620",
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
            }
        }

        // Send request to signing API
        const response = await axios.post(`${process.env.SIGN_URL}/esign/request`, signRequestPayload, {
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": process.env.API_KEY,
                "X-API-APP-ID": process.env.API_APP_ID,
            },
        });

        if (!response.data.success) {
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
            documentId: response && response.data && response.data.data && response.data.data.documentId,
            documentReferenceId: response && response.data && response.data.data && response.data.data.documentReferenceId,
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