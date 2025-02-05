const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    company: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    name: {
      type: String,
    },
    userType: {
      type: String,
    },
    isSuperAdmin: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", userSchema);