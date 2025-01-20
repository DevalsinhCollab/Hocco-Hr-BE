const mongoose = require("mongoose");
const SignAgreement = new mongoose.Schema(
  {
    documentBase64: {
      type: Object,
      trim: true,
    },
    templateId: {
      type: String,
      trim: true,
    },
    assetsId: {
      type: String,
      trim: true,
    },
    res_docket_id: {
      type: String,
      trim: true,
    },
    res_document_id: {
      type: String,
      trim: true,
    },
    res_signer_info: {
      type: Array,
      default: [],
    },
    res_resId: {
      type: String,
      trim: true,
    },
    signStatus: {
      type: String,
      trim: true,
      default: "US",
      enum: ["US", "S"],
    },
    custCode: {
      type: String,
      trim: true,
    },
    assetSerialNumber: {
      type: String,
      trim: true,
    },
    isSigned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("SignAgreement", SignAgreement);
