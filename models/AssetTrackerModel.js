const mongoose = require("mongoose");
const assetTracker = new mongoose.Schema(
  {
    custCode: {
      type: String,
      trim: true,
    },
    assetSerialNumber: {
      type: String,
      trim: true,
    },
    assetsId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
    },
    barCode: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("AssetTracker", assetTracker);
