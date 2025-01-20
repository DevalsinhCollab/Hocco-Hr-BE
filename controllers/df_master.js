const DFMaster = require("../models/df_master");
const AssetTracker = require("../models/AssetTrackerModel");

exports.addmultidfmaster = async (req, res) => {
  try {
    const oldDFMaster = await DFMaster.find({});
    const oldDFList = new Set(
      oldDFMaster.map((data) => data.assetSerialNumber)
    );
    const oldDFMap = oldDFMaster.reduce((map, obj) => {
      map[obj.assetSerialNumber] = obj;
      return map;
    }, {});

    function findDuplicateSerialNumberIndexes(array) {
      const serialNumberIndexes = {};
      const duplicates = new Set();

      array.forEach((item, index) => {
        const assetSerialNumber = item.assetSerialNumber;

        if (serialNumberIndexes[assetSerialNumber] !== undefined) {
          duplicates.add(index + 2);
          duplicates.add(serialNumberIndexes[assetSerialNumber]);
        } else {
          serialNumberIndexes[assetSerialNumber] = index + 2;
        }
      });

      return [...duplicates];
    }

    const hasDuplicate = findDuplicateSerialNumberIndexes(req.body);
    if (oldDFMaster.length === 0 && hasDuplicate.length === 0) {
      const newData = req.body.filter((item) => item.assetSerialNumber !== "");

      const data = newData.map((item) => {
        const { " bookValue ": bookValue, ...rest } = item;
        return { bookValue, ...rest };
      });

      const newAddDF = await DFMaster.insertMany(data);

      if (newAddDF) {
        const assetsLogs = newAddDF.map((data) => ({
          custCode: data.custCode,
          assetSerialNumber: data.assetSerialNumber,
          assetsId: data._id,
          status: "Tag",
          barCode: data.barCode,
        }));
        await AssetTracker.insertMany(assetsLogs);
        return res.status(200).json(newAddDF);
      }
    }

    const newDFKeys = Object.keys(oldDFMaster[0]?._doc || {}).filter(
      (key) =>
        !["_id", "__v", "createdAt", "updatedAt", "trackingStatus"].includes(
          key
        )
    );

    if (hasDuplicate.length === 0) {
      const numbers = req.body.map((str) => Number(str.depositAmount));
      if (numbers.some((num) => !Number.isInteger(num))) {
        return res.status(400).json({
          error: true,
          message: "Type of deposit amount is not an integer",
        });
      }

      const newAddedData = [];
      const updateOperations = [];
      const assetTrackerOperations = [];

      req.body.forEach((element) => {
        const existingRecord = oldDFMap[element.assetSerialNumber];
        if (existingRecord) {
          let needsUpdate = false;
          newDFKeys.forEach((dataKey) => {
            if (element[dataKey] !== existingRecord[dataKey]) {
              needsUpdate = true;
            }
          });
          if (needsUpdate) {
            updateOperations.push({
              updateOne: {
                filter: { assetSerialNumber: element.assetSerialNumber },
                update: { $set: element },
              },
            });

            if (element.custCode !== existingRecord.custCode) {
              assetTrackerOperations.push({
                custCode: element.custCode,
                assetSerialNumber: element.assetSerialNumber,
                assetsId: existingRecord._id,
                status: "Tag",
                barCode: element.barCode,
              });
            }
          }
        } else {
          newAddedData.push(element);
        }
      });

      const uniqueNewAddedData = newAddedData.filter(
        (value, index, self) =>
          index ===
          self.findIndex((v) => v.assetSerialNumber === value.assetSerialNumber)
      );

      if (uniqueNewAddedData.length > 0) {
        const newData = uniqueNewAddedData.filter(
          (item) => item.assetSerialNumber !== ""
        );
        const data = newData.map((item) => {
          const { " bookValue ": bookValue, ...rest } = item;
          return { bookValue, ...rest };
        });

        const addDF = await DFMaster.insertMany(data);
        if (addDF) {
          assetTrackerOperations.push(
            ...addDF.map((data) => ({
              custCode: data.custCode,
              assetSerialNumber: data.assetSerialNumber,
              assetsId: data._id,
              status: "Tag",
              barCode: data.barCode,
            }))
          );
        }
      }

      await Promise.all([
        updateOperations.length > 0
          ? DFMaster.bulkWrite(updateOperations)
          : Promise.resolve(),
        assetTrackerOperations.length > 0
          ? AssetTracker.insertMany(assetTrackerOperations)
          : Promise.resolve(),
      ]);

      const getAllDFs = await DFMaster.find({});
      return res.status(200).json(getAllDFs);
    }

    return res.status(400).json({
      error: `Duplicate serial number found on line ${hasDuplicate.join(", ")}`,
    });
  } catch (error) {
    const numbers = req.body.map((str) => Number(str.depositAmount));
    if (numbers.some((num) => !Number.isInteger(num))) {
      return res.status(400).json({
        error: "Type of deposit amount is not an integer",
      });
    }

    return res.status(400).json(error);
  }
};

exports.getdfmaster = async (req, res) => {
  try {
    const { page, pageSize, assetSerialNumber, customer, barCode, search } = req.query;

    let findObject = {};

    if (search) {
      findObject.$or = [
        { custCode: { $regex: search.trim(), $options: "i" } },
        { assetSerialNumber: { $regex: search.trim(), $options: "i" } },
        { barCode: { $regex: search.trim(), $options: "i" } },
        { trackingStatus: { $regex: search.trim(), $options: "i" } },
        { assetStatus: { $regex: search.trim(), $options: "i" } },
        { materialCodeHOCCO: { $regex: search.trim(), $options: "i" } },
        { materialDescriptionHOCCO: { $regex: search.trim(), $options: "i" } },
        { manufacture: { $regex: search.trim(), $options: "i" } },
        { materialVendor: { $regex: search.trim(), $options: "i" } },
        { materialDescriptionVendor: { $regex: search.trim(), $options: "i" } },
        { custName: { $regex: search.trim(), $options: "i" } },
        { custType: { $regex: search.trim(), $options: "i" } },
        { dfType: { $regex: search.trim(), $options: "i" } },
        { paymentMode: { $regex: search.trim(), $options: "i" } },
        { purchaseValueHOCCO: { $regex: search.trim(), $options: "i" } },
        { bookValue: { $regex: search.trim(), $options: "i" } },
        { stateName: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (assetSerialNumber) {
      findObject.assetSerialNumber = assetSerialNumber;
    }

    if (customer) {
      findObject.custCode = customer;
    }

    if (barCode) {
      findObject.barCode = barCode;
    }

    const skip = page * pageSize;

    const dfMaster = await DFMaster.find(findObject)
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    const total = await DFMaster.countDocuments(findObject);

    return res
      .status(200)
      .json({ error: false, data: dfMaster, totalCount: total });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getdfmasterbyId = async (req, res) => {
  try {
    const { id } = req.params;
    const dfMaster = await DFMaster.findById(id);
    return res.status(200).json(dfMaster);
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.updateDfMasterTrackingStatus = async (req, res) => {
  const { id } = req.params;
  const { trackingStatus, assetTrackerId } = req.body;

  try {
    const updateDfMasterTrackingStatus = await DFMaster.findByIdAndUpdate(
      id,
      { trackingStatus },
      { new: true }
    );

    await AssetTracker.findByIdAndUpdate(
      assetTrackerId,
      { status: trackingStatus },
      { new: true }
    );

    return res.status(200).json({
      error: false,
      data: updateDfMasterTrackingStatus,
      success: true,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { depositAmount, shortFiled, barCode, assetSerialNumber } = req.body;

    let data = {
      depositAmount,
      shortFiled,
      barCode,
      assetSerialNumber,
    };

    const updateAsset = await DFMaster.findByIdAndUpdate(id, data, {
      new: true,
    });

    return res.status(200).json({
      message: "Asset Updated",
      data: updateAsset,
      success: true,
    });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getDFByAssetSerialNumber = async (req, res) => {
  try {
    const { assetSerialNumber } = req.body;
    const asset = await DFMaster.findOne({ assetSerialNumber }).lean().exec();

    return res.status(200).json({ data: asset, error: false });
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.getAllAssetsForExcel = async (req, res) => {
  try {
    const { assetSerialNumber, customer, barCode, search } = req.query;

    let findObject = {};

    if (search) {
      findObject.$or = [
        { custCode: { $regex: search.trim(), $options: "i" } },
        { assetSerialNumber: { $regex: search.trim(), $options: "i" } },
        { barCode: { $regex: search.trim(), $options: "i" } },
        { trackingStatus: { $regex: search.trim(), $options: "i" } },
        { assetStatus: { $regex: search.trim(), $options: "i" } },
        { materialCodeHOCCO: { $regex: search.trim(), $options: "i" } },
        { materialDescriptionHOCCO: { $regex: search.trim(), $options: "i" } },
        { manufacture: { $regex: search.trim(), $options: "i" } },
        { materialVendor: { $regex: search.trim(), $options: "i" } },
        { materialDescriptionVendor: { $regex: search.trim(), $options: "i" } },
        { custName: { $regex: search.trim(), $options: "i" } },
        { custType: { $regex: search.trim(), $options: "i" } },
        { dfType: { $regex: search.trim(), $options: "i" } },
        { paymentMode: { $regex: search.trim(), $options: "i" } },
        { purchaseValueHOCCO: { $regex: search.trim(), $options: "i" } },
        { bookValue: { $regex: search.trim(), $options: "i" } },
        { stateName: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (assetSerialNumber) {
      findObject.assetSerialNumber = assetSerialNumber;
    }

    if (customer) {
      findObject.custCode = customer;
    }

    if (barCode) {
      findObject.barCode = barCode;
    }

    const data = await DFMaster.find(findObject).lean().exec();

    // Example usage:
    return res.status(200).json({ data: data, error: false });
  } catch (error) {
    console.log(error, "getAllCustomersForExcel error========");
  }
};

exports.searchSerialNumberAndBarCode = async (req, res) => {
  try {
    const { search } = req.body;
    const limit = 5;

    // for searching
    let findObject = {};
    if (search) {
      findObject.$or = [
        { assetSerialNumber: { $regex: search.trim(), $options: "i" } },
        { barCode: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const dfData = await DFMaster.find(findObject)
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean()
      .exec();

    return res.status(200).json({
      error: false,
      data: dfData,
    });
  } catch (error) {
    return res.status(400).json({ error: true, message: error.message });
  }
};

exports.getDFByCustCode = async (req, res) => {
  try {
    const { custCode } = req.body;
    const asset = await DFMaster.find({ custCode }).lean().exec();

    return res.status(200).json({ data: asset, error: false });
  } catch (error) {
    return res.status(400).json(error);
  }
};