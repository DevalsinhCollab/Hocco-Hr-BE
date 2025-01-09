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
    designation: {
      type: String,
      trim: true,
    },
    salary: {
      type: String,
      trim: true,
    },
    salaryPa: {
      type: String,
      trim: true,
    },
    basicSalary: {
      type: String,
      trim: true,
    },
    basicSalaryPa: {
      type: String,
      trim: true,
    },
    allowances: {
      type: String,
      trim: true,
    },
    allowancesPa: {
      type: String,
      trim: true,
    },
    educationAllowance: {
      type: String,
      trim: true,
    },
    educationAllowancePa: {
      type: String,
      trim: true,
    },
    attendanceAllowance: {
      type: String,
      trim: true,
    },
    attendanceAllowancePa: {
      type: String,
      trim: true,
    },
    hra: {
      type: String,
      trim: true,
    },
    hraPa: {
      type: String,
      trim: true,
    },
    monthlyBonus: {
      type: String,
      trim: true,
    },
    monthlyBonusPa: {
      type: String,
      trim: true,
    },
    productionIncentive: {
      type: String,
      trim: true,
    },
    productionIncentivePa: {
      type: String,
      trim: true,
    },
    companyContribution: {
      type: String,
      trim: true,
    },
    companyContributionPa: {
      type: String,
      trim: true,
    },
    providentFund: {
      type: String,
      trim: true,
    },
    providentFundPa: {
      type: String,
      trim: true,
    },
    employeeStateInsuranceCorporation: {
      type: String,
      trim: true,
    },
    employeeStateInsuranceCorporationPa: {
      type: String,
      trim: true,
    },
    bonusExgratia: {
      type: String,
      trim: true,
    },
    bonusExgratiaPa: {
      type: String,
      trim: true,
    },
    variablePay: {
      type: String,
      trim: true,
    },
    variablePayPa: {
      type: String,
      trim: true,
    },
    totalCTC: {
      type: String,
      trim: true,
    },
    totalCTCPa: {
      type: String,
      trim: true,
    },
    residentialAddress: {
      type: String,
      trim: true,
    },
    noticePeriod: {
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