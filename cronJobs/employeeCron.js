const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { base64ToS3 } = require("../utils/base64ToS3");
const { default: axios } = require("axios");
const DocumentSchema = require("../models/document")
const EmployeeSchema = require("../models/employee")

// Create the transporter for Nodemailer
const transporter = nodemailer.createTransport({
  service: "Hotmail",
  auth: {
    user: "sales.report@hocco.in",
    pass: "qfpcfydjfwgvkphq",
  },
  tls: {
    rejectUnauthorized: false,  // Optional, but may help avoid some issues
  },
});

// Email sending function
async function sendEmail(subject, text, agreeId, findEmployee) {

  const mailOptions = {
    from: `"No Reply" sales.report@hocco.in`,
    to: "deval@collabsoftech.com.au",
    cc: findEmployee && findEmployee.cc.length > 0 && findEmployee.cc || [],
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `Email sent successfully for employee ${findEmployee.empCode}`
    );

    await DocumentSchema.findByIdAndUpdate(
      agreeId,
      { isSigned: true },
      { new: true }
    );
  } catch (error) {
    console.error(
      `Error sending email for employee ${findEmployee.empCode}:`,
      error
    );
  }
}

// Process and update a signed agreement
async function processSignedDocument(item) {
  try {
    const resData = await axios.post(
      `${process.env.SIGN_URL}/getSignatureStatus`,
      { document_id: item.documentId },
      {
        headers: {
          "Content-Type": "application/json",
          "x-parse-application-id": process.env.APPLICATION_ID,
          "x-parse-rest-api-key": process.env.APPLICATION_KEY,
        },
      }
    );

    let checkData = resData && resData.data;
    const allSignedInfo = checkData?.signer_info?.[0]?.status;

    if (allSignedInfo === "signed") {
      const response = await axios.post(
        `${process.env.SIGN_URL}/getDocketInfo`,
        { document_id: item.documentId, docket_id: item.docketId },
        {
          headers: {
            "Content-Type": "application/json",
            "x-parse-application-id": process.env.APPLICATION_ID,
            "x-parse-rest-api-key": process.env.APPLICATION_KEY,
          },
        }
      );

      const getNewBase64Data = response.data;
      const base64Data = getNewBase64Data?.docket_Info?.[0]?.content;

      let docLink;
      if (base64Data) {
        docLink = await base64ToS3(base64Data, {
          _id: item._id,
          empCode: item.empCode,
        });
      } else {
        docLink = await base64ToS3(item.document, {
          _id: item._id,
          empCode: item.empCode,
        });
      }

      return await DocumentSchema.findByIdAndUpdate(
        item._id,
        { signStatus: "Signed", document: docLink, status: "Completed" },
        { new: true }
      );
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error processing agreement with _id ${item._id}:`, error);
    return null;
  }
}

// Fetch and send emails for updated documents
async function processUpdatedDocuments(documents) {
  let documentsProcessed = 0;

  for (const updatedSignDocument of documents) {
    try {
      if (updatedSignDocument && updatedSignDocument._id) {
        const findEmployee = await EmployeeSchema.findOne({
          empCode: updatedSignDocument.empCode,
        });
        if (!findEmployee) {
          console.error(
            `Employee with empCode ${updatedSignDocument.empCode} not found`
          );
          continue;
        }

        const subject = `Signed Agreement by ${findEmployee.name}-${findEmployee.empCode}`;
        const text = `Signed Agreement by ${findEmployee.name}-${findEmployee.empCode}, Link of the pdf: ${updatedSignDocument.document.Location}`;

        await sendEmail(
          subject,
          text,
          updatedSignDocument._id,
          findEmployee
        );
      }
      documentsProcessed++;
    } catch (error) {
      console.error(
        `Error processing agreement with _id ${updatedSignDocument && updatedSignDocument._id
        }:`,
        error
      );
    }
  }

  console.log(
    documentsProcessed > 0
      ? `All documents processed. Total processed: ${documentsProcessed}`
      : "No documents were processed."
  );
}

// Process data in chunks and return only signed documents
async function processInChunks(data, chunkSize, processFunction) {
  const signedData = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const results = await Promise.all(chunk.map(processFunction));
    // Filter out null results and combine them
    signedData.push(...results.filter((result) => result !== null));
  }
  return signedData;
}

// Cron job task
async function employeeCronTask() {
  console.log("Cron Job started");

  try {
    // First part: Process unsigned documents
    const unSignedDocuments = await DocumentSchema.find({ signStatus: "Unsigned" })
      .lean()
      .exec();

    let returnData = [];
    // Process unsigned documents in chunks of 10
    if (unSignedDocuments.length > 0) {
      returnData = await processInChunks(
        unSignedDocuments,
        10,
        processSignedDocument
      );
    } else {
      console.log("No unsigned documents found.");
    }

    if (returnData && returnData.length > 0) {
      console.log("Combined signed documents from all chunks:", returnData);
      await processUpdatedDocuments(returnData); // Pass the combined data
    } else {
      console.log("No documents updated in the last 1 hour.");
    }
  } catch (error) {
    console.error("Error in cron job:", error);
  }
}

// Cron job scheduler
function employeeCron() {
  cron.schedule("0 */1 * * *", employeeCronTask); // Runs every 1 hour
  // cron.schedule("*/2 * * * *", employeeCronTask); // Runs every 2 minutes
}

module.exports = employeeCron;
