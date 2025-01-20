const mongoose = require('mongoose');

const dfStoreSchema = mongoose.Schema({
    prDocType: {
        type: String,
    },
    accountAssCategory: {
        type: String,
    },
    material: {
        type: String,
    },
    shortText: {
        type: String,
    },
    quantity: {
        type: String,
    },
    unit: {
        type: String,
    },
    c: {
        type: String,
    },
    deliveryDate: {
        type: String,
    },
    materialGroup : {
        type: String,
    },
    plant:{
        type: String,
    },	
    storLoc: {
        type: String,
    },
    pgr:{
        type: String,
    },	
    requisitioner: {
        type: String,
    },	
    trackingNo: {
        type: String,
    },
    from: {
        type: String,
    },
    fixedVendor:{
        type: String,
    },
    vendorName:{
        type: String,
    },
    porg: {
        type: String,
    },
    agreement:{
        type: String,
    },
    item:{
        type: String,
    },
    assetCode: {
        type: String,
    },
    recipient: {
        type: String,
    },
    customer: {
        type: String,
    },
    bankSlipNoDepositVBAK_ZBNK_SLP_NO: {
        type: String,
    },
    bankDepositDateVBAK_ZBNK_DEP_DT: {
        type: String,
    },
    rtgsNoVBAK_ZNEFT_RTGS: {
        type: String,
    },
    chqDDNoVBAK_ZCHK_NO: {
        type: String,
    },
    bankNameVBAK_ZBNK_DET: {
        type: String,
    },
    machineDepositVBAK_ZCHK_AMT: {
        type: String,
    },
    recdOnVBAK_ZCHK_DATE: {
        type: String,
    },
    customerNameVBAK_ZCUST_NAME: {
        type: String,
    },
    bankSlipNoServiceChargeVBAK_ZBNK_SLP_NO1:{
        type: String,
    },
    slipDepositDateVBAK_ZBNK_DEP_DT1: {
        type: String,
    },
    rtgsNoVBAK_ZNEFT_RTGS1: {
        type: String,
    },
    chqNoVBAK_ZCHK_NO1: {
        type: String,
    },
    bankNameVBAK_ZBNK_DET1: {
        type: String,
    },
    paymentMode:{
        type: String,
    },
    requestDate: {
        type: String,
    },
    finalApprovedDate: {
        type: String,
    },
    recdOnVBAK_ZCHK_DATE1: {
        type: String,
    },
    firstYearFreeVBAK_ZFRST_YR: {
        type: String,
    },
    secondYearFreeVBAK_ZSEC_YR: {
        type: String,
    },
    lifetimeFreeVBAK_ZFIN_YR: {
        type: String,
    },
    machineSupplyNew_Existing: {
        type: String,
    },
    dfRemarks:{
        type: String,
    },
    userID: {
        type: String,
    },
    userName: {
        type: String,
    },
    atosGenNo: {
        type: String,
    }
},
{ timestamps: true }
);

module.exports = mongoose.model('dfStore', dfStoreSchema);