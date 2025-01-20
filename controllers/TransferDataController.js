const SignAgreementSchema = require("../models/SignAgreementModel");
const { base64ToS3 } = require("../utils/base64ToS3");
const EmpTemplates = require("../models/template");

exports.transferBase64ToAWS = async (req, res) => {
  try {
    const { count } = req.params;

    const updatedAgreements = [];

    const allAgreements = await SignAgreementSchema.find({
      documentBase64: { $type: "string" },
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(count))
      .lean()
      .exec();

    const agreementsBatch = await Promise.all(
      allAgreements.map(async (agreement) => {
        const docLink = await base64ToS3(agreement?.documentBase64, {
          _id: agreement?._id,
          code: agreement?.custCode,
        });

        const updatedAgreement = await SignAgreementSchema.findByIdAndUpdate(
          agreement._id,
          {
            $set: { documentBase64: docLink },
          },
          { new: true }
        ).lean();

        return updatedAgreement;
      })
    );

    updatedAgreements.push(...agreementsBatch);
    res.status(200).json({
      count: updatedAgreements.length,
      updatedAgreements,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};

exports.transferBase64ToAWSForHr = async (req, res) => {
  try {
    const { count } = req.params;

    const updatedDocs = [];

    const allDocs = await EmpTemplates.find({
      document: { $type: "string" },
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(count))
      .lean()
      .exec();

    const docsBatch = await Promise.all(
      allDocs.map(async (doc) => {
        const docLink = await base64ToS3(doc?.document, {
          _id: doc?._id,
          code: doc?.empCode,
        });

        const updatedDoc = await EmpTemplates.findByIdAndUpdate(
          doc._id,
          {
            $set: { document: docLink },
          },
          { new: true }
        ).lean();

        return updatedDoc;
      })
    );

    updatedDocs.push(...docsBatch);
    res.status(200).json({
      count: updatedDocs.length,
      updatedDocs,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
};
