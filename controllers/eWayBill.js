const axios = require("axios");
const Challan = require("../models/deliveryChallan");
const moment = require("moment");

exports.createEwayBill = async (req, res, data) => {
  try {
    const {
      _id,
      gstin,
      companyname,
      challannumber,
      challandate,
      transportmode,
      vehiclenumber,
      transportdate,
      placeofsupply,
      address,
      state,
      goods,
      freight,
      insurance,
      packageingcharges,
      totalchallan,
      totalchallanwords,
      termsandcondition,
      addtermsandcondition,
      note,
      eWayBillNo,
      shippingCustAdd,
      approxDistance,
    } = data;

    let itemListData = [];

    Array.from(goods).forEach((element) => {
      itemListData.push({
        invoiceNo: "1110/2223/G01438",
        itemNo: "FGVT00003",
        productName: "TestPro1",
        productDesc: "TestDes1",
        hsnCode: "69072100",
        quantity: "1",
        qtyUnit: "BOX",
        taxableAmount: element.taxableAmount || 0,
        sgstRate: element.SGSTRate,
        cgstRate: element.CGSTRate,
        igstRate: element.IGSTRate,
        cessRate: "",
        cessAdvol: "",
      });
    });

    const date = new Date();
    const cDate = `${date.getDate()}-${
      date.getMonth() + 1
    }-${date.getFullYear()}`;

    const randomNumber = Math.floor(Math.random() * 9000) + 1000;

    async function getAuthToken() {
      const getToken = await axios.post(
        "http://powergstservice.microvistatech.com/Api/MVEWBAuthenticate/MVAuthentication",
        {
          MVApiKey: "IPSZfNmcQCUNMfx",
          MVSecretKey: "NyWQEq+4YWungcL1hfzGQA==",
          gstin: "24AAAPI3182M002",
          eWayBillUserName: "test_24_001",
          eWayBillPassword: "Trial63$value",
        },
        {
          headers: {
            "content-Type": "application/json",
          },
        }
      );

      return getToken.data.AuthenticationToken;
    }

    async function getDetailsOfeBill(eWayBillNo) {
      const getEwayBill = await axios.post(
        "http://powergstservice.microvistatech.com/api/MVEWBAuthenticate/MVGetEWBDetails",
        {
          EwaybillNumber: `${eWayBillNo}`,
        },
        {
          headers: {
            "content-Type": "application/json",
            MVApiKey: "IPSZfNmcQCUNMfx",
            MVSecretKey: "NyWQEq+4YWungcL1hfzGQA==",
            gstin: "24AAAPI3182M002",
            eWayBillUserName: "test_24_001",
            eWayBillPassword: "Trial63$value",
            AuthenticationToken: "376ef69-ea02-4267-8a78-5aca61144",
          },
        }
      );
      return getEwayBill.data;
    }

    const totalCGSTAmount = goods.reduce((accumulator, currentItem) => {
      return accumulator + currentItem.CGSTAmount;
    }, 0);

    const totalSGSTAmount = goods.reduce((accumulator, currentItem) => {
      return accumulator + currentItem.SGSTAmount;
    }, 0);

    const totalIGSTValue = goods.reduce((accumulator, currentItem) => {
      return accumulator + currentItem.IGSTAmount;
    }, 0);

    if (eWayBillNo) {
      let resData = await getDetailsOfeBill(eWayBillNo);
      let data = await Challan.findById(_id);

      // return res.status(200).json([resData, data]);

      return [resData, data];
    } else {
      let authToken = await getAuthToken();

      const date = new Date();
      let formattedDate = moment(date).format("DD-MM-YYYY");

      const response = await axios.post(
        "https://powergstservice.microvistatech.com/api/MVEWBAuthenticate/MVGenerationWithDist",
        {
          version: "1.0.0123",
          billLists: [
            {
              userGstin: "24AAAPI3182M002",
              supplyType: "O",
              subSupplyType: "8",
              subSupplyDesc: "test data",
              docType: "CHL",
              docNo: `MV-VSD-${randomNumber}`,
              docDate: formattedDate,
              fromGstin: "24AAAPI3182M002",
              fromTrdName: "e-Way Bill SandBox",
              fromAddr1: address,
              fromAddr2: shippingCustAdd,
              fromPlace: "Ahmedabad",
              fromPincode: "380007",
              fromStateCode: "24",
              despatchStateCode: "24",
              toGstin: "URP",
              toTrdName: "companyname",
              toAddr1: address,
              toAddr2: address,
              toPlace: "Ahmedabad",
              toPincode: "380007",
              toStateCode: "24",
              shiptoStateCode: "24",
              transactionType: "1",
              totalValue: "0",
              cgstValue: totalCGSTAmount,
              sgstValue: totalSGSTAmount,
              igstValue: totalIGSTValue,
              cessValue: "",
              cessNonAdvolValue: "",
              otherValue: "0",
              totInvValue: "0",
              transMode: "1",
              transDistance: approxDistance,
              transporterName: "test",
              transporterId: "",
              transDocNo: "WWER",
              transDocDate: formattedDate,
              vehicleNo: vehiclenumber,
              vehicleType: "R",
              itemList: itemListData,
            },
          ],
        },
        {
          headers: {
            "content-type": "application/json",
            MVApiKey: "IPSZfNmcQCUNMfx",
            MVSecretKey: "NyWQEq+4YWungcL1hfzGQA==",
            gstin: "24AAAPI3182M002",
            eWayBillUserName: "test_24_001",
            eWayBillPassword: "Trial63$value",
            AuthenticationToken: authToken,
            MonthYear: "11-2023",
          },
        }
      );

      if (response?.data?.lstEWBRes[0]?.ewayBillNo) {
        let data = await Challan.findByIdAndUpdate(
          _id,
          { eWayBillNo: response?.data?.lstEWBRes[0]?.ewayBillNo },
          { new: true }
        );

        let resData = await getDetailsOfeBill(
          response?.data?.lstEWBRes[0]?.ewayBillNo
        );

        return [resData, data];
      }
    }
  } catch (error) {
    return res.status(400).json(error);
  }
};
