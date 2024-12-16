const mongoose = require("mongoose");
const Template = new mongoose.Schema(
  {
    templateName: {
      type: String,
      trim: true,
    },
    mainTemplate: {
      type: String,
      trim: true,
    },
    fields: {
      type: Array,
      default: [],
    },
    htmlTemplate: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Templates", Template);
