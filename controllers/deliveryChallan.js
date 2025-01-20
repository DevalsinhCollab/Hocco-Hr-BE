const Challan = require("../models/deliveryChallan");
const { createChallanPdf } = require("../pdf/DeliveryChallan");
const { createEWayPdf } = require("../pdf/EWay");
const PdfPrinter = require("pdfmake");
const { createEwayBill } = require("./eWayBill");
const runFunction = require("../qrcode");

exports.createChallan = async (req, res) => {
  try {
    const {
      gstin,
      companyname,
      customername,
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
      shippingFrom,
      shippingCustId,
      shippingGoDownId,
      shippingCustAdd,
      approxDistance,
      transporternametype,
      transportername,
      reasonfortransport,
      initialgeneratedby,
      generatedby,
      customerPhone,
      customerFrom,
      customerTo
    } = req.body;

    const dChallan = await Challan.create({
      gstin,
      companyname,
      customername,
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
      shippingFrom,
      shippingCustId,
      shippingGoDownId,
      shippingCustAdd,
      approxDistance,
      transporternametype,
      transportername,
      reasonfortransport,
      initialgeneratedby,
      generatedby,
      customerPhone,
      customerFrom,
      customerTo
    });

    return res.status(200).json({ error: false, data: dChallan });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

exports.getchallan = async (req, res) => {
  try {
    const { page = 0, pageSize = 10, search } = req.body;

    let findObject = {};
    if (search) {
      findObject.$or = [
        { eWayBillNo: { $regex: search.trim(), $options: "i" } },
        { gstin: { $regex: search.trim(), $options: "i" } },
        { customername: { $regex: search.trim(), $options: "i" } },
        { challannumber: { $regex: search.trim(), $options: "i" } },
        { transportmode: { $regex: search.trim(), $options: "i" } },
        { vehiclenumber: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = page * pageSize;
    const totalCount = await Challan.countDocuments(findObject);
    const getchallan = await Challan.find(findObject)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean()
      .exec();

    // const getchallan = await Challan.find();
    return res.status(200).json({ error: false, data: getchallan, totalCount });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

exports.getchallanbyid = async (req, res) => {
  try {
    const { id } = req.params;
    const getchallanbyid = await Challan.findById(id);
    return res.status(200).json({ error: false, data: getchallanbyid });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

exports.generateChallanPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const getChallanData = await Challan.findById(id);

    const fonts = {
      Roboto: {
        normal: "fonts/Roboto-Regular.ttf",
        bold: "fonts/Roboto-Medium.ttf",
        italics: "fonts/Roboto-Italic.ttf",
        bolditalics: "fonts/Roboto-MediumItalic.ttf",
      },
    };

    let docDefinition;

    if (getChallanData) {
      docDefinition = await createChallanPdf(req, res, getChallanData, id);
    }

    const printer = new PdfPrinter(fonts);

    const pdfDoc = printer.createPdfKitDocument(docDefinition, {});
    res.setHeader("Content-Type", "application/pdf");

    pdfDoc.pipe(res);
    pdfDoc.end();

    // To Download the PDF Document
    // const binaryResult = await createPdf(docDefinition);
    // // const html = '<h1>Hola</h1>';
    // res.setHeader('Content-disposition', 'attachment; filename=report.pdf');
    // res.type('pdf').send(binaryResult);
  } catch (error) {
    return res.status(400).json({ error });
  }
};

exports.generateEwayPdf = async (req, res) => {
  try {
    const { id } = req.params;

    const getChallanDataById = await Challan.findById(id);

    if (getChallanDataById) {
      let createEwayBillData = await createEwayBill(
        req,
        res,
        getChallanDataById
      );

      const fonts = {
        Roboto: {
          normal: "fonts/Roboto-Regular.ttf",
          bold: "fonts/Roboto-Medium.ttf",
          italics: "fonts/Roboto-Italic.ttf",
          bolditalics: "fonts/Roboto-MediumItalic.ttf",
        },
      };

      let docDefinition;

      let ewayBillNo = { bill: "", date: "", gst: "" };

      if (
        createEwayBillData &&
        createEwayBillData[0] &&
        createEwayBillData[0]
      ) {
        ewayBillNo.bill = createEwayBillData[0].ewbNo.toString();
        ewayBillNo.gst = createEwayBillData[0].userGstin;
        ewayBillNo.date = createEwayBillData[0].ewayBillDate;
      }

      runFunction(ewayBillNo)
        .then(async (response) => {
          if (createEwayBillData) {
            docDefinition = await createEWayPdf(
              req,
              res,
              createEwayBillData,
              response
            );

            const printer = new PdfPrinter(fonts);

            const pdfDoc = printer.createPdfKitDocument(docDefinition, {});
            res.setHeader("Content-Type", "application/pdf");

            pdfDoc.pipe(res);
            pdfDoc.end();
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  } catch (error) {
    return res.status(400).json({ error });
  }
};
