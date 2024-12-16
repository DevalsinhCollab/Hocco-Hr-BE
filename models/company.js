const mongoose = require("mongoose");

const companySchema = mongoose.Schema(
    {
        name: {
            type: String,
        },
        email: {
            type: String,
        },
        phone: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("company", companySchema);