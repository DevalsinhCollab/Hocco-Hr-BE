const mongoose = require("mongoose");
const Document = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'company',
    },
    empName: {
      type: String,
      ref: "user",
    },
    empCode: {
      type: String,
      ref: "user",
    },
    document: {
      type: Object,
      trim: true,
    },
    documentId: {
      type: String,
      trim: true,
    },
    docketId: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
      enum: ["Sent", "Completed"],
      default: "Sent"
    },
    signStatus: {
      type: String,
      trim: true,
      enum: ["Unsigned", "Signed"],
      default: "Unsigned"
    },
    signType: {
      type: String,
      trim: true,
      enum: ["adhar", "dsc"],
      default: "adhar"
    },
    isSigned: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("document", Document);