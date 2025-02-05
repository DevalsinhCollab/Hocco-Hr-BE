const { default: axios } = require("axios");
const AssetTrackerModel = require("../models/AssetTrackerModel");
const DFMasterSchema = require("../models/df_master");
const CustomerSchema = require("../models/customer");
const SignAgreementSchema = require("../models/SignAgreementModel");
const moment = require("moment");

exports.createMultiAssets = async (req, res) => {
  try {
    const oldAssets = await AssetTrackerModel.find({});

    let existingData = [];

    Array.from(oldAssets).forEach((element) => {
      Array.from(req.body).forEach((ele) => {
        if (element.custId == ele.custId) {
          existingData.push(ele.custId);
        }
      });
    });

    if (existingData.length == 0) {
      const assets = await AssetTrackerModel.insertMany(req.body);

      return res.status(200).json({ assets, success: true });
    } else {
      return res.status(400).json({ error: existingData, success: false });
    }
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getMultiAssets = async (req, res) => {
  try {
    const {
      page = 0,
      pageSize = 10,
      customer,
      assetSerialNumber,
      asmName,
      tsmName: tsmVSEName,
      search
    } = req.query;

    // Only make a query if asmName or tsmVSEName is provided
    let custCodeArray = [];

    if (asmName && tsmVSEName) {
      const customers = await CustomerSchema.find({
        $and: [
          { asmName: { $exists: true } },
          { asmName: { $ne: "" } },
          { asmName: asmName },
          { tsmVSEName: { $exists: true } },
          { tsmVSEName: { $ne: "" } },
          { tsmVSEName: tsmVSEName },
        ],
      });

      if (customers.length > 0) {
        custCodeArray = customers.map((item) => item.custCode);
      }
    } else if (asmName || tsmVSEName) {
      const customers = await CustomerSchema.find({
        $or: [
          {
            $and: [
              { asmName: { $exists: true } },
              { asmName: { $ne: "" } },
              { asmName: asmName },
            ],
          },
          {
            $and: [
              { tsmVSEName: { $exists: true } },
              { tsmVSEName: { $ne: "" } },
              { tsmVSEName: tsmVSEName },
            ],
          },
        ],
      });

      if (customers.length > 0) {
        custCodeArray = customers.map((item) => item.custCode);
      }
    }

    let skip = page * pageSize;

    let matchStage = {};

    if (search) {
      matchStage.$or = [
        { custCode: { $regex: search.trim(), $options: "i" } },
        { assetSerialNumber: { $regex: search.trim(), $options: "i" } },
        { status: { $regex: search.trim(), $options: "i" } },
        { barCode: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (customer || assetSerialNumber || custCodeArray.length > 0) {
      matchStage.$and = [];

      if (customer) {
        matchStage.$and.push({ custCode: customer });
      }

      if (assetSerialNumber) {
        matchStage.$and.push({ assetSerialNumber });
      }

      if (custCodeArray.length > 0) {
        matchStage.$and.push({ custCode: { $in: custCodeArray } });
      }
    }

    const getAllAssetsViaPagination = await AssetTrackerModel.aggregate(
      [
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        {
          $group: {
            _id: "$assetSerialNumber",
            custCode: { $last: "$custCode" },
            status: { $last: "$status" },
            barCode: { $last: "$barCode" },
            assetSerialNumber: { $last: "$assetSerialNumber" },
            assetsId: { $last: "$assetsId" },
            createdAt: { $last: "$createdAt" },
            updatedAt: { $last: "$updatedAt" },
            id: { $last: "$_id" },
          },
        },
        {
          $facet: {
            totalCount: [{ $count: "count" }],
            groupedData: [
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: Number(pageSize) },
            ],
          },
        },
      ],
      { allowDiskUse: true }
    );

    async function addCustomerNamesAndCheckAgreement(data) {
      const customerCodes = data.map((item) => item.custCode);
      const customers = await CustomerSchema.find({
        custCode: { $in: customerCodes },
      }).lean();

      const customerMap = customers.reduce((acc, customer) => {
        acc[customer.custCode] = customer;
        return acc;
      }, {});

      // Extract all assetSerialNumber from data
      const assetSerialNumbers = data.map((item) => item.assetSerialNumber);

      // Query the SignAgreement schema to check if assetSerialNumber exists
      const signAgreements = await SignAgreementSchema.find({
        assetSerialNumber: { $in: assetSerialNumbers },
      }).lean();

      // Create a set of assetSerialNumbers found in SignAgreement
      const agreementCustAssetsSet = new Set(
        signAgreements.map(
          (agreement) => `${agreement.custCode}-${agreement.assetSerialNumber}`
        )
      );

      return data.map((item) => ({
        ...item,
        custName: customerMap[item.custCode]?.custName || "",
        tsmVSEName: customerMap[item.custCode]?.tsmVSEName || "",
        tsmVSEEmail: customerMap[item.custCode]?.tsmVSEEmail || "",
        asmName: customerMap[item.custCode]?.asmName || "",
        asmEmail: customerMap[item.custCode]?.asmEmail || "",
        agreementExists: agreementCustAssetsSet.has(
          `${item.custCode}-${item.assetSerialNumber}`
        ), // Check if both custCode and assetSerialNumber exist together
      }));
    }

    const result = await addCustomerNamesAndCheckAgreement(
      getAllAssetsViaPagination[0].groupedData
    );
    const totalCount = getAllAssetsViaPagination[0].totalCount[0]?.count || 0;

    return res.status(200).json({
      aggregateData: result,
      success: true,
      total: totalCount,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.assetAgreement = async (req, res) => {
  try {
    const docxtopdf = await axios.post(
      "http://127.0.0.1:5000/docxtopdf",
      req.body,
      {
        headers: {
          "content-Type": "application/json",
        },
      }
    );
    return res
      .status(200)
      .json({ error: false, data: docxtopdf.data, success: true });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.assetRelease = async (req, res) => {
  try {
    const { status, assetsId, custCode, assetTrackerId, assetTrackerData } =
      req.body;

    let data;
    let todaysDate = new Date();

    if (status === "C2C") {
      let finalData = {
        ...assetTrackerData,
        custCode: custCode,
      };
      // new entry in asset tracker
      data = await AssetTrackerModel.create(finalData);

      // for getting customer name
      const findCustomer = await CustomerSchema.find({ custCode });

      // update the df master
      await DFMasterSchema.findByIdAndUpdate(
        assetsId,
        {
          custCode,
          custName: findCustomer[0].custName,
          installationDate: moment(todaysDate).format("DD/MM/YYYY"),
        },
        { new: true }
      );
    } else {
      let finalData = {
        ...assetTrackerData,
        custCode: "Depo",
      };

      data = await AssetTrackerModel.create(finalData);

      // new entry in asset tracker
      // await AssetTrackerModel.findByIdAndUpdate(assetTrackerId, finalData, {
      //   new: true,
      // });

      // update the df master
      await DFMasterSchema.findByIdAndUpdate(
        assetsId,
        { custCode: "Depo", custName: "Depo" },
        { new: true }
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Updated successfully", data: data });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getAssetsBySerialNumber = async (req, res) => {
  try {
    const { assetSerialNumber } = req.query;

    const getAllAssets = await AssetTrackerModel.find({
      assetSerialNumber: assetSerialNumber,
    }).sort({ createdAt: -1 });

    async function addCustomerNames(data) {
      const promises = [];

      data.forEach((item) => {
        const promise = Promise.all([
          CustomerSchema.findOne({ custCode: item.custCode }),
        ]).then(([findCust]) => {
          return {
            ...item.toObject(),
            custName: findCust ? findCust.custName : "",
          };
        });

        promises.push(promise);
      });

      const result = await Promise.all(promises);
      return result;
    }

    // Example usage:
    addCustomerNames(getAllAssets).then(async (result) => {
      return res.status(200).json({
        error: false,
        data: result,
      });
    });

    // return res.status(200).json({
    //   data: getAllAssets,
    //   success: true,
    // });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getAgreementByAssetId = async (req, res) => {
  try {
    const { id } = req.params;

    const findAgreementPdf = await SignAgreementSchema.findOne({
      assetsId: id,
    });

    return res.status(200).json({ error: false, data: findAgreementPdf });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getLatestAssetTracker = async (req, res) => {
  try {
    let pageSize = 5;

    const latestAsset = await AssetTrackerModel.aggregate(
      [
        {
          $group: {
            _id: "$assetSerialNumber",
            custCode: { $last: "$custCode" },
            status: { $last: "$status" },
            barCode: { $last: "$barCode" },
            assetSerialNumber: { $last: "$assetSerialNumber" },
            assetsId: { $last: "$assetsId" },
            createdAt: { $last: "$createdAt" },
            updatedAt: { $last: "$updatedAt" },
            id: { $last: "$_id" },
          },
        },
        {
          $facet: {
            groupedData: [
              { $sort: { createdAt: -1 } },
              { $limit: Number(pageSize) },
            ],
          },
        },
      ],
      { allowDiskUse: true }
    );

    async function addCustomerNamesAndCheckAgreement(data) {
      const customerCodes = data.map((item) => item.custCode);
      const customers = await CustomerSchema.find({
        custCode: { $in: customerCodes },
      }).lean();

      const customerMap = customers.reduce((acc, customer) => {
        acc[customer.custCode] = customer;
        return acc;
      }, {});

      // Extract all assetSerialNumber from data
      const assetSerialNumbers = data.map((item) => item.assetSerialNumber);

      // Query the SignAgreement schema to check if assetSerialNumber exists
      const signAgreements = await SignAgreementSchema.find({
        assetSerialNumber: { $in: assetSerialNumbers },
      }).lean();

      // Create a set of assetSerialNumbers found in SignAgreement
      const agreementCustAssetsSet = new Set(
        signAgreements.map(
          (agreement) => `${agreement.custCode}-${agreement.assetSerialNumber}`
        )
      );

      return data.map((item) => ({
        ...item,
        custName: customerMap[item.custCode]?.custName || "",
        tsmVSEName: customerMap[item.custCode]?.tsmVSEName || "",
        tsmVSEEmail: customerMap[item.custCode]?.tsmVSEEmail || "",
        asmName: customerMap[item.custCode]?.asmName || "",
        asmEmail: customerMap[item.custCode]?.asmEmail || "",
        agreementExists: agreementCustAssetsSet.has(
          `${item.custCode}-${item.assetSerialNumber}`
        ), // Check if both custCode and assetSerialNumber exist together
      }));
    }

    const result = await addCustomerNamesAndCheckAgreement(
      latestAsset[0].groupedData
    );

    return res.status(200).json({
      data: result,
      message: "Latest Asset Trackers fetched successfully",
      error: false,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
