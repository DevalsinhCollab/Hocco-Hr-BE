const mongoose = require("mongoose");

const customerSchema = mongoose.Schema(
  {
    status: {
      type: String,
    },
    custCode: {
      type: String,
    },
    custName: {
      type: String,
    },
    sdCode: {
      type: String,
    },
    sdName: {
      type: String,
    },
    addressDescription: {
      type: String,
    },
    custAddress: {
      type: String,
    },
    pinCode: {
      type: String,
    },
    city: {
      type: String,
    },
    stateCode: {
      type: String,
    },
    stateName: {
      type: String,
    },
    zone: {
      type: String,
    },
    country: {
      type: String,
    },
    wholesalerCode: {
      type: String,
    },
    wholesellerName: {
      type: String,
    },
    site: {
      type: String,
    },
    warehouse: {
      type: String,
    },
    priceGroup: {
      type: String,
    },
    createdDate: {
      type: String,
    },
    firstBillingDate: {
      type: String,
    },
    closingDate: {
      type: String,
    },
    custEmailID: {
      type: String,
    },
    contactPersonName: {
      type: String,
    },
    contactPersonMobile: {
      type: String,
    },
    custGroupCode: {
      type: String,
    },
    custGroupName: {
      type: String,
    },
    channelCode: {
      type: String,
    },
    channelName: {
      type: String,
    },
    subChannelCode: {
      type: String,
    },
    subChannelName: {
      type: String,
    },
    salesGroup: {
      type: String,
    },
    pan: {
      type: String,
    },
    adhar: {
      type: String,
    },
    gst: {
      type: String,
    },
    codeCreationEmpCode: {
      type: String,
    },
    rgmCode: {
      type: String,
    },
    rgmName: {
      type: String,
    },
    zmRSMCode: {
      type: String,
    },
    zmRSMName: {
      type: String,
    },
    asmCode: {
      type: String,
    },
    asmName: {
      type: String,
    },
    asmEmail: {
      type: String,
    },
    tsmVSECode: {
      type: String,
    },
    tsmVSEName: {
      type: String,
    },
    tsmVSEEmail: {
      type: String,
    },
    psr1Code: {
      type: String,
    },
    psr1Name: {
      type: String,
    },
    psr2Code: {
      type: String,
    },
    psr2Name: {
      type: String,
    },
    nationalHeadCode: {
      type: String,
    },
    nationalHeadName: {
      type: String,
    },
    kamCode: {
      type: String,
    },
    kamName: {
      type: String,
    },
    kaeCode: {
      type: String,
    },
    kaeName: {
      type: String,
    },
    birthYear: {
      type: String,
    },
    gender: {
      type: String,
    },
    rsmCode: {
      type: String,
    },
    rsmName: {
      type: String,
    },
    adharName: {
      type: String,
    },
    isDelete: {
      type: String,
      enum: [0, 1],
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("customer", customerSchema);
