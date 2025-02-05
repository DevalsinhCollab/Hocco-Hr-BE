const mongoose = require("mongoose");
const DistributorDocument = new mongoose.Schema(
  {
    custCode: {
      type: String,
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
    signStatus: {
      type: String,
      trim: true,
      enum: ["Unsigned", "Signed"],
    },
    docType: {
      type: String,
      trim: true,
      enum: ["dis", "cfa", "vrs"],
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("DistributorDocuments", DistributorDocument);
