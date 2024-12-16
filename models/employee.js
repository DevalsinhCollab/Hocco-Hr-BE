const mongoose = require("mongoose");

const employeeSchema = mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'company',
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
    },
    empCode: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    cc: {
      type: Array,
      default: [],
    },
    location: {
      type: String,
      trim: true,
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
      default: 0
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("employee", employeeSchema);