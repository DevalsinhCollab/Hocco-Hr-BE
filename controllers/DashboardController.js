const EmpTemplate = require("../models/template");
const EmployeeSchema = require("../models/EmployeeModel");
const DFMaster = require("../models/df_master");
const CustomerSchema = require("../models/customer");
const AgreementSchema = require("../models/SignAgreementModel");
const DistributorSchema = require("../models/DistributorModel");
const DistributorTemplate = require("../models/DistributorTemplate");
const moment = require("moment");

exports.empDashboard = async (req, res) => {
  try {
    let employeeCount = await EmployeeSchema.countDocuments({
      isDelete: "0",
    })
      .lean()
      .exec();

    let docCount = await EmpTemplate.countDocuments({}).lean().exec();
    let signedCount = await EmpTemplate.countDocuments({ signStatus: "Signed" })
      .lean()
      .exec();
    let unSignedCount = await EmpTemplate.countDocuments({
      signStatus: "Unsigned",
    })
      .lean()
      .exec();

    let inProcessCount = await EmployeeSchema.countDocuments({
      isDelete: "0",
      status: "Sent",
    })
      .lean()
      .exec();

    let completedCount = await EmployeeSchema.countDocuments({
      isDelete: "0",
      status: "Completed",
    })
      .lean()
      .exec();

    return res.status(200).json({
      employeeCount,
      docCount,
      signedCount,
      unSignedCount,
      inProcessCount,
      completedCount,
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
        DistributorTemplate.countDocuments({}).lean().exec(),
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
      message: "Count fetched successfully",
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
