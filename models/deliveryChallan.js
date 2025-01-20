const mongoose = require("mongoose");
const sequencing = require("./counter");

const challanSchema = new mongoose.Schema(
  {
    gstin: {
      type: String,
      trim: true,
    },
    companyname: {
      type: String,
      trim: true,
    },
    customername: {
      type: String,
      trim: true,
    },
    challannumber: {
      type: String,
      trim: true,
    },
    challandate: {
      type: Date,
      default: Date.now(),
    },
    transportmode: {
      type: String,
      trim: true,
    },
    vehiclenumber: {
      type: String,
      trim: true,
    },
    transportdate: {
      type: Date,
      default: Date.now(),
    },
    placeofsupply: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    goods: {
      type: Array,
      default: Array,
    },
    freight: {
      type: String,
      trim: true,
    },
    insurance: {
      type: String,
      trim: true,
    },
    packageingcharges: {
      type: String,
      trim: true,
    },
    totalchallan: {
      type: String,
      trim: true,
    },
    totalchallanwords: {
      type: String,
      trim: true,
    },
    termsandcondition: {
      type: String,
      trim: true,
    },
    addtermsandcondition: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    shippingFrom: {
      type: String,
      trim: true,
    },
    shippingCustId: {
      type: String,
      trim: true,
    },
    shippingGoDownId: {
      type: String,
      trim: true,
    },
    shippingCustAdd: {
      type: String,
      trim: true,
    },
    eWayBillNo: {
      type: String,
      trim: true,
    },
    approxDistance: {
      type: String,
      trim: true,
    },
    transporternametype: {
      type: String,
      trim: true,
    },
    transportername: {
      type: String,
      trim: true,
    },
    reasonfortransport: {
      type: String,
      trim: true,
    },
    initialgeneratedby: {
      type: String,
      trim: true,
    },
    generatedby: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    customerFrom: {
      type: String,
    },
    customerTo: {
      type: String,
    },
  },
  { timestamps: true }
);

challanSchema.pre("save", function (next) {
  sequencing
    .getSequenceNextValue("challan_counter")
    .then((counter) => {
      this.challannumber = counter;
      next();
    })
    .catch((error) => next(error));
});

module.exports = mongoose.model("Challan", challanSchema);
