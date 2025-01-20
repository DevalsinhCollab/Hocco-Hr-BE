const numWords = require("num-words");

exports.createChallanPdf = async (req, res, data, soId) => {
  try {
    const { goods } = data;

    let taxableAmountT = 0;
    let cgstR = 0;
    let cgstA = 0;
    let sgstR = 0;
    let sgstA = 0;
    let igstR = 0;
    let igstA = 0;

    goods.forEach((element) => {
      taxableAmountT += Number(element.taxableAmount?.replace(/\,/g, ""));
      cgstR += Number(element.CGSTRate);
      cgstA += Number(element.CGSTAmount);
      sgstR += Number(element.SGSTRate);
      sgstA += Number(element.SGSTAmount);
      igstR += Number(element.IGSTRate);
      igstA += Number(element.IGSTAmount);
    });

    function dateFormate(date) {
      let newDate = new Date(date);
      return `${newDate.getDate()}-${
        newDate.getMonth() + 1
      }-${newDate.getFullYear()}`;
    }

    function convertToWords(value) {
      const rupeesInWords = numWords(value, { and: true });
      return rupeesInWords.charAt(0)?.toUpperCase() + rupeesInWords.slice(1); // Capitalize the first letter
    }

    const textCapitalize = (value) => {
      if (value) {
        const words = value.split(" ");

        for (let i = 0; i < words.length; i++) {
          words[i] = words[i][0]?.toUpperCase() + words[i].substr(1);
        }
        return words.join(" ");
      } else {
        return "";
      }
    };

    const signText = (value) => {
      if (value) {
        const words = value.split("@");
        return words[0];
      } else {
        return "";
      }
    };

    const logoBase64 =
      "data:image/png;base64,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";

    let totalAmount =
      data &&
      data.placeofsupply &&
      data.placeofsupply.toLowerCase() === "gujarat"
        ? taxableAmountT + cgstA + sgstA
        : taxableAmountT + igstA;

    const documentDefinition = {
      pageSize: {
        width: 750,
        height: "auto",
      },
      info: {
        title: "Delivery Challan",
      },
      content: [
        {
          image: logoBase64,
          width: 100,
          height: 30,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          text: `Delivery Challan`,
          fontSize: 18,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          text: `For transportation of goods on account of reasons other than supply`,
          fontSize: 12,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          text: "(Issued under rule 55 of CGST rule, 2017)",
          fontSize: 12,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*", "*"],
            body: [
              [
                {
                  text: "Reg Office: 12,13 Floor,\n1201-1204, 1301-1302, Elenza Vertex, Sindhu bhawan road, Bodakdev, Ahmedabad-380059",
                  fontSize: 10,
                  bold: false,
                },
                {
                  text: "HOCCO FOODS PRIVATE LIMITED (consignor)",
                  fontSize: 10,
                  bold: false,
                },
                {
                  text: "GSTIN: 24AAHCR3681C1ZJ",
                  fontSize: 10,
                  bold: false,
                },
              ],
            ],
          },
        },
        {
          margin: [0, 20, 0, 0],
          table: {
            headerRows: 1,
            widths: ["*", "*"],
            body: [
              [
                {
                  text: "Details of Consignee",
                  fontSize: 12,
                  bold: true,
                  border: [1, 1, 1, 1],
                },

                {
                  text: "Original/Duplicate/Triplicate",
                  fontSize: 12,
                  bold: true,
                },
              ],
            ],
          },
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*"],
            body: [
              [
                {
                  text: `Name: ${textCapitalize(data.customername)}`,
                  fontSize: 10,
                  bold: false,
                  border: [1, 0, 1, 1],
                },

                {
                  text: `Transport Mode: ${textCapitalize(data.transportmode)}`,
                  fontSize: 10,
                  bold: false,
                  border: [1, 0, 1, 1],
                },
              ],
              [
                {
                  text: `Address: ${textCapitalize(data.address)}`,
                  fontSize: 10,
                  bold: false,
                  border: [1, 0, 1, 1],
                },
                {
                  text: `Transport Name: ${textCapitalize(
                    data.transportername
                  )}`,
                  fontSize: 10,
                  bold: false,
                  border: [1, 0, 1, 1],
                },
              ],
              [
                {
                  text: `GSTIN: ${textCapitalize(data.gstin)}`,
                  fontSize: 10,
                  bold: false,
                  border: [1, 0, 1, 1],
                },
                {
                  text: `Vehicle number: ${textCapitalize(data.vehiclenumber)}`,
                  fontSize: 10,
                  bold: false,
                  border: [1, 0, 1, 1],
                },
              ],
              [
                {
                  text: `State: ${textCapitalize(data.placeofsupply)}`,
                  fontSize: 10,
                  bold: false,
                  border: [1, 0, 1, 1],
                },
                {
                  text: `Place of supply: ${textCapitalize(
                    data.placeofsupply
                  )}`,
                  fontSize: 10,
                  bold: false,
                  border: [1, 0, 1, 1],
                },
              ],
              [
                {
                  text: `Customer Mobile: ${data.customerPhone}`,
                  fontSize: 10,
                  bold: false,
                  border: [1, 0, 1, 1],
                },
                {
                  text: ``,
                  fontSize: 10,
                  bold: false,
                  border: [1, 0, 1, 1],
                },
              ],
            ],
          },
        },
        {
          margin: [0, 20, 0, 0],
          table: {
            headerRows: 1,
            widths: ["*", "*"],
            body: [
              [
                {
                  text: `Approx Distance: ${textCapitalize(
                    data.approxDistance
                  )} KM`,
                  fontSize: 10,
                  bold: false,
                },
                {
                  text: "Shipping From",
                  border: [1, 1, 1, 1],
                  fontSize: 12,
                  bold: true,
                },
              ],
            ],
          },
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*"],
            body: [
              [
                {
                  text: `Delivery Challan number: ${textCapitalize(
                    data.challannumber
                  )}`,
                  fontSize: 10,
                  bold: false,
                  border: [1, 0, 1, 1],
                },
                {
                  text: `Address: ${textCapitalize(data.shippingCustAdd)}`,
                  border: [1, 0, 1, 1],
                  border: [true, false, true, false],
                  fontSize: 10,
                  bold: false,
                },
              ],
              [
                {
                  text: `Delivery Challan date: ${dateFormate(
                    data.challandate
                  )}`,
                  fontSize: 10,
                  bold: false,
                  border: [1, 0, 1, 1],
                },
                {
                  text: "",
                  fontSize: 12,
                  margin: [9, 9, 9, 9],
                  border: [true, false, true, true],
                  bold: true,
                },
              ],
            ],
          },
        },
        {
          margin: [-25, 20, 90, 0],
          // widths: ["*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*", "*"],
          fontSize: 10,
          table: {
            body: [
              [
                "Sr. No.",
                "Description of Goods",
                "Description of Vendor",
                "Serial Number",
                "Bar Code",
                "HSN code",
                "Qty",
                "Taxable Amount",
                "Rate ( CGST )",
                "Amount ( CGST )",
                "Rate ( SGST )",
                "Amount ( SGST )",
                "Rate ( IGST )",
                "Amount ( IGST )",
              ],
              ...goods?.map((x) => [
                `${x.id + 1}`,
                `${
                  x.materialDescriptionHOCCO ? x.materialDescriptionHOCCO : "-"
                }`,
                `${
                  x.materialDescriptionVendor
                    ? x.materialDescriptionVendor
                    : "-"
                }`,
                `${x.assetSerialNumber ? x.assetSerialNumber : "-"}`,
                `${x.barCode ? x.barCode : "-"}`,
                `${x.hsn ? x.hsn : "-"}`,
                `1`,
                `${x.taxableAmount ? x.taxableAmount : "-"}`,
                `${x.CGSTRate ? x.CGSTRate : "-"}`,
                `${
                  x.CGSTAmount?.toFixed(2) % 1 > 0.5
                    ? Math.ceil(x.CGSTAmount)
                    : Math.floor(x.CGSTAmount)
                }`,
                `${x.SGSTRate ? x.SGSTRate : "-"}`,
                `${
                  x.SGSTAmount?.toFixed(2) % 1 > 0.5
                    ? Math.ceil(x.SGSTAmount)
                    : Math.floor(x.SGSTAmount)
                }`,
                `${x.IGSTRate ? x.IGSTRate : "-"}`,
                `${
                  x.IGSTAmount?.toFixed(2) % 1 > 0.5
                    ? Math.ceil(x.IGSTAmount)
                    : Math.floor(x.IGSTAmount)
                }`,
              ]),
              [
                "",
                "Total",
                "",
                "",
                "",
                "",
                "",
                `${taxableAmountT ? taxableAmountT : "-"}`,
                `${cgstR ? cgstR : "-"}`,
                `${
                  cgstA?.toFixed(2) % 1 > 0.5
                    ? Math.ceil(cgstA)
                    : Math.floor(cgstA)
                }`,
                `${sgstR ? sgstR : "-"}`,
                `${
                  sgstA?.toFixed(2) % 1 > 0.5
                    ? Math.ceil(sgstA)
                    : Math.floor(sgstA)
                }`,
                `${igstR ? igstR : "-"}`,
                `${
                  igstA?.toFixed(2) % 1 > 0.5
                    ? Math.ceil(igstA)
                    : Math.floor(igstA)
                }`,
              ],
            ],
          },
        },
        {
          margin: [0, 10, 0, 0],
          table: {
            headerRows: 1,
            widths: ["*", "*"],
            body: [
              [
                {
                  text: `Total challan amount in Rs.: ${
                    totalAmount.toFixed(2) % 1 > 0.5
                      ? Math.ceil(totalAmount)
                      : Math.floor(totalAmount)
                  }`,
                  fontSize: 12,
                  border: [true, true, false, false],
                  bold: true,
                },
                {
                  text: "Certified that the particulars given above are true and correct",
                  fontSize: 12,
                  border: [true, true, true, false],
                  bold: true,
                },
              ],
            ],
          },
        },
        {
          margin: [0, 0, 0, 0],
          table: {
            headerRows: 1,
            widths: ["*", "*"],
            body: [
              [
                {
                  text: `Total challan amount in words: ${textCapitalize(
                    convertToWords(
                      totalAmount.toFixed(2) % 1 > 0.5
                        ? Math.ceil(totalAmount)
                        : Math.floor(totalAmount)
                    )
                  )}`,
                  fontSize: 12,
                  border: [true, true, false, false],
                  bold: true,
                },
                {
                  text: "",
                  fontSize: 12,
                  border: [true, true, true, false],
                  bold: true,
                },
              ],
            ],
          },
        },
        {
          margin: [0, 0, 0, 0],
          table: {
            headerRows: 1,
            widths: ["*", "*"],
            body: [
              [
                {
                  text: "",
                  border: [true, false, true, false],
                },
                {
                  text: `${textCapitalize(signText(data.initialgeneratedby))}`,
                  fontSize: 25,
                  alignment: "center",
                  border: [true, false, true, false],
                  bold: true,
                },
              ],
            ],
          },
        },
        {
          margin: [0, 0, 0, 0],
          table: {
            headerRows: 1,
            widths: ["*", "*"],
            body: [
              [
                {
                  text: `Terms & Conditions:- This delivery challan is prepared for transportation of machine given under lease contract.`,
                  fontSize: 12,
                  bold: true,
                },
                {
                  text: "For HOCCO FOODS PRIVATE LIMITED",
                  fontSize: 12,
                  bold: true,
                },
              ],
            ],
          },
        },
      ],
    };

    return documentDefinition;
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error");
    }
  }
};
