const mongoose = require("mongoose");

const distributorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
    },
    custCode: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
      enum: ["Pending", "Unsent", "Sent", "Completed"],
    },
    adhar: {
      type: String,
      trim: true,
    },
    birth: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
    },
    isDelete: {
      type: String,
      enum: [0, 1],
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
    startDate: {
      type: String,
      trim: true,
    },
    endDate: {
      type: String,
      trim: true,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("distributors", distributorSchema);
