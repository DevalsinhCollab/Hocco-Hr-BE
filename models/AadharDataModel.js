const mongoose = require("mongoose");
const aadhar = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    adhar: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    birth: {
      type: String,
      trim: true,
    },
    custCode: {
      type: String,
      trim: true,
    },
    custId: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
      enum: ["M", "F", "O"],
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("aadhar", aadhar);
