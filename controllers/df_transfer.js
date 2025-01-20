const DFHistory = require("../models/df_history");
const DFMaster = require("../models/dfMaster");

exports.dftransfer = async (req, res) => {
  try {
    const { custId, assetsId } = req.body;

    const DFTransferCheck = await DFHistory.create({
      custId,
      assetsId,
    });

    const DFMasterCheck = await DFMaster.findByIdAndUpdate(
      assetsId,
      { currentCustId: custId },
      { new: true }
    );

    if (DFMasterCheck && DFTransferCheck) {
      return res.status(200).json({ message: "done" });
    }
  } catch (error) {
    return res.status(400).json(error);
  }
};

exports.releasedf = async (req, res) => {
  try {
    const { assetsId } = req.body;

    const DFTransferCheck = await DFHistory.create({
      custId: "0",
      assetsId,
    });

    const DFMasterCheck = await DFMaster.findByIdAndUpdate(
      assetsId,
      { currentCustId: "0" },
      { new: true }
    );

    if (DFMasterCheck && DFTransferCheck) {
      return res.status(200).json({ message: "done" });
    }
  } catch (error) {
    return res.status(400).json(error);
  }
};
