const cron = require("node-cron");
const nodemailer = require("nodemailer");
const SignAgreement = require("../models/SignAgreementModel");
const Customer = require("../models/customer");
const { base64ToS3 } = require("../utils/base64ToS3");
const { default: axios } = require("axios");

// Create the transporter for Nodemailer
const transporter = nodemailer.createTransport({
  service: "Hotmail",
  auth: {
    user: "sales.report@hocco.in",
    pass: "fgrnpmhntzhllgqg",
  },
  tls: {
    rejectUnauthorized: false,  // Optional, but may help avoid some issues
  },
});

// Email sending function
async function sendEmail(to, subject, text, agreeId, findCustomer) {
  const mailOptions = {
    from: `"No Reply" sales.report@hocco.in`,
    to,
    cc: ["harsh.chovatiya@hocco.in", "deval@collabsoftech.com.au"],
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `Email sent successfully for customer ${findCustomer.custCode}`
    );

    await SignAgreement.findByIdAndUpdate(
      agreeId,
      { isSigned: true },
      { new: true }
    );
  } catch (error) {
    console.error(
      `Error sending email for customer ${findCustomer.custCode}:`,
      error
    );
  }
}

// Process and update a signed agreement
async function processSignedAgreement(item) {
  try {
    // const resData = await axios.post(
    //   `${process.env.SIGN_URL}/getSignatureStatus`,
    //   { document_id: item.res_document_id },
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       "x-parse-application-id": "collabsoftechpvt.ltd_esign_production",
    //       "x-parse-rest-api-key": "4174eee2c8d1cd2b89b8e8ddfd221211",
    //     },
    //   }
    // );

    const resData = await axios.post(
      `${process.env.SIGN_URL}/esign/status`,
      { documentId: item.res_document_id, documentReferenceId: item.res_reference_id },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.API_KEY,
          "X-API-APP-ID": process.env.API_APP_ID,
        },
      }
    );

    let checkData = resData && resData.data && resData.data.data;

    // const allSignedInfo = checkData?.signer_info?.[0]?.status;
    const allSignedInfo = checkData && checkData.documentStatus;

    if (allSignedInfo === "Signed") {
      // const response = await axios.post(
      //   `${process.env.SIGN_URL}/getDocketInfo`,
      //   { document_id: item.res_document_id, docket_id: item.res_docket_id },
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //       "x-parse-application-id": "collabsoftechpvt.ltd_esign_production",
      //       "x-parse-rest-api-key": "4174eee2c8d1cd2b89b8e8ddfd221211",
      //     },
      //   }
      // );

      // const getNewBase64Data = response.data;
      // const base64Data = getNewBase64Data?.docket_Info?.[0]?.content;
      const base64Data = checkData.content;

      let docLink;
      if (base64Data) {
        docLink = await base64ToS3(base64Data, {
          _id: item._id,
          code: item.custCode,
        });
      } else {
        docLink = await base64ToS3(item.documentBase64, {
          _id: item._id,
          code: item.custCode,
        });
      }

      return await SignAgreement.findByIdAndUpdate(
        item._id,
        { signStatus: "S", documentBase64: docLink },
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

// Fetch and send emails for updated agreements
async function processUpdatedAgreements(agreements) {
  let agreementsProcessed = 0;

  for (const updatedSignAgreement of agreements) {
    try {
      if (updatedSignAgreement && updatedSignAgreement._id) {
        const findCustomer = await Customer.findOne({
          custCode: updatedSignAgreement.custCode,
        });
        if (!findCustomer) {
          console.error(
            `Customer with custCode ${updatedSignAgreement.custCode} not found`
          );
          continue;
        }

        const emailArray = [
          findCustomer.tsmVSEEmail,
          findCustomer.asmEmail,
        ].filter(Boolean);

        const email =
          emailArray.join(", ") ||
          findCustomer.tsmVSEEmail ||
          findCustomer.asmEmail;
        const subject = `Signed Agreement by ${findCustomer.custName}-${findCustomer.custCode}`;
        const text = `Signed Agreement by ${findCustomer.custName}-${findCustomer.custCode}, Link of the pdf: ${updatedSignAgreement.documentBase64.Location}`;

        await sendEmail(
          email,
          subject,
          text,
          updatedSignAgreement._id,
          findCustomer
        );
      }
      agreementsProcessed++;
    } catch (error) {
      console.error(
        `Error processing agreement with _id ${updatedSignAgreement && updatedSignAgreement._id
        }:`,
        error
      );
    }
  }

  console.log(
    agreementsProcessed > 0
      ? `All agreements processed. Total processed: ${agreementsProcessed}`
      : "No agreements were processed."
  );
}

// Process data in chunks and return only signed agreements
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
async function dfCronTask() {
  console.log("Cron Job started for df");

  try {
    // First part: Process unsigned agreements
    const unsignedAgreements = await SignAgreement.find({ signStatus: "US" })
      .lean()
      .exec();

    let returnData = [];
    // Process unsigned agreements in chunks of 10
    if (unsignedAgreements.length > 0) {
      returnData = await processInChunks(
        unsignedAgreements,
        10,
        processSignedAgreement
      );
    } else {
      console.log("No unsigned agreements found.");
    }

    if (returnData && returnData.length > 0) {
      console.log("Combined signed agreements from all chunks:", returnData);
      await processUpdatedAgreements(returnData); // Pass the combined data
    } else {
      console.log("No agreements updated in the last 2 hours.");
    }
  } catch (error) {
    console.error("Error in df cron job:", error);
  }
}

// Cron job scheduler
function dfCron() {
  // cron.schedule("*/2 * * * *", dfCronTask); // Runs every 2 minutes
  cron.schedule("0 */2 * * *", dfCronTask); // Runs every 2 hours
}

module.exports = dfCron;