const EmployeeSchema = require("../models/employee")
const DocumentSchema = require("../models/document")
const UserSchema = require("../models/user");
const DFMaster = require("../models/df_master");
const CustomerSchema = require("../models/customer");
const AgreementSchema = require("../models/SignAgreementModel");
const { default: mongoose } = require("mongoose");
const DistributorSchema = require("../models/DistributorModel");
const DistributorDocument = require("../models/DistributorDocument");
const moment = require("moment");

exports.getDashboardCount = async (req, res) => {
    try {
        const { userId } = req


        const userData = await UserSchema.findById(userId)

        const documentCounts = await DocumentSchema.aggregate([
            {
                $facet: {
                    totalDocuments: [{ $match: { company: new mongoose.Types.ObjectId(userData.company) } }, { $count: "total" }],
                    signedDocuments: [{ $match: { signStatus: "Signed", company: new mongoose.Types.ObjectId(userData.company) } }, { $count: "signed" }],
                    unsignedDocuments: [{ $match: { signStatus: "Unsigned", company: new mongoose.Types.ObjectId(userData.company) } }, { $count: "unsigned" }],
                    inProgressDocuments: [{ $match: { status: "Sent", company: new mongoose.Types.ObjectId(userData.company) } }, { $count: "inProgress" }],
                    completedDocuments: [{ $match: { status: "Completed", company: new mongoose.Types.ObjectId(userData.company) } }, { $count: "completed" }]
                }
            }
        ]).allowDiskUse(true);

        const [documentStats] = documentCounts;
        const employeeCount = await EmployeeSchema.countDocuments({ company: new mongoose.Types.ObjectId(userData.company) });

        return res.status(200).json({
            data: {
                employeeCount,
                documentCount: documentStats.totalDocuments[0]?.total || 0,
                signedDocuments: documentStats.signedDocuments[0]?.signed || 0,
                unSignedCount: documentStats.unsignedDocuments[0]?.unsigned || 0,
                inProgressCount: documentStats.inProgressDocuments[0]?.inProgress || 0,
                completedCount: documentStats.completedDocuments[0]?.completed || 0,
            }
        });
    } catch (error) {
        return res.status(400).json(error);
    }
};

exports.dfDashboard = async (req, res) => {
    try {
        let dfData = await DFMaster.countDocuments({}).lean().exec();

        let customerData = await CustomerSchema.countDocuments({}).lean().exec();

        let agreementData = await AgreementSchema.countDocuments({}).lean().exec();

        return res.status(200).json({
            dfCount: dfData,
            customerCount: customerData,
            agreementCount: agreementData,
            message: "Count fetched successfully",
            error: false,
        });
    } catch (error) {
        console.log(error, "error=========");
    }
};

exports.disDashboard = async (req, res) => {
  try {
    // Execute all queries in parallel
    const [docsData, disData, cfaData, vrsData, disTemplateData] =
      await Promise.all([
        DistributorSchema.find({}).lean().exec(),
        DistributorSchema.countDocuments({ isDelete: "0", docType: "dis" })
          .lean()
          .exec(),
        DistributorSchema.countDocuments({ isDelete: "0", docType: "cfa" })
          .lean()
          .exec(),
        DistributorSchema.countDocuments({ isDelete: "0", docType: "vrs" })
          .lean()
          .exec(),
        DistributorDocument.countDocuments({}).lean().exec(),
      ]);

    const today = moment();
    const oneMonthFromNow = moment().add(1, "months");

    let expiredData = docsData.filter((item) => {
      let endDate = moment(item.endDate, "DD-MM-YY"); // Convert endDate to moment object
      return endDate.isBefore(today); // Compare if endDate is before today's date
    });

    // Filter records where the endDate is within the next month
    let expiringSoonData = docsData.filter((item) => {
      let endDate = moment(item.endDate, "DD-MM-YY"); // Convert endDate to moment object
      return endDate.isAfter(today) && endDate.isBefore(oneMonthFromNow); // Check if endDate is within the next month
    });

    let expiringSoonCount = expiringSoonData.length;
    let expiredDataCount = expiredData.length;

    // Send response
    return res.status(200).json({
      disCount: disData,
      cfaCount: cfaData,
      vrsCount: vrsData,
      disTemplateCount: disTemplateData,
      expiringSoonCount,
      expiredDataCount,
      message: "Dis count fetched successfully",
      error: false,
    });
  } catch (error) {
    console.log(error, "error=====");

    return res.status(500).json({
      message: "An error occurred while fetching counts",
      error: true,
    });
  }
};