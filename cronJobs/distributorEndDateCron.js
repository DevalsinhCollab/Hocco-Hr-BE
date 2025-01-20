const cron = require("node-cron");
const nodemailer = require("nodemailer");
const moment = require("moment"); // To handle date comparison
const DistributorSchema = require("../models/DistributorModel");
const DistributorTemplate = require("../models/DistributorTemplate");

// Create the transporter for Nodemailer
const transporter = nodemailer.createTransport({
  service: "Hotmail", // Change according to your email provider
  auth: {
    user: process.env.DF_EMAIL,
    pass: process.env.DF_PASS,
  },
});

// Email sending function
async function sendEmail(to, subject, text, disId, base64Pdf) {
  let buffer;

  if (base64Pdf && base64Pdf !== null && base64Pdf.document) {
    buffer = Buffer.from(base64Pdf.document, "base64");
  }

  let mailOptions;

  if (base64Pdf !== null) {
    mailOptions = {
      from: `"No Reply" ${process.env.DF_EMAIL}`,
      to: to,
      cc: "amit@collabsoftech.com.au",
      subject,
      text,
      attachments: [
        {
          filename: "Document.pdf",
          content: buffer,
          contentType: "application/pdf",
        },
      ],
    };
  } else {
    mailOptions = {
      from: `"No Reply" ${process.env.DF_EMAIL}`,
      to: to,
      cc: "amit@collabsoftech.com.au",
      subject,
      text,
    };
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);

    await DistributorSchema.findOneAndUpdate(
      { _id: disId },
      { emailSent: true }
    );
  } catch (error) {
    console.log("Error sending email:", error);
  }
}

// Cron job task
async function distributorCronTask() {
  console.log("Cron Job started for distributor");

  try {
    // Fetch distributors who haven't been sent an email
    const disData = await DistributorSchema.find({ emailSent: false })
      .lean()
      .exec();

    console.log("Fetched distributor data:", disData); // Check if data is being fetched

    if (!disData || disData.length === 0) {
      return console.log("No emails to send");
    }

    // Current date
    const now = moment();
    console.log("Current date:", now.format("DD/MM/YYYY"));

    disData.forEach(async (item) => {
      console.log(
        `Processing distributor: ${item.name}, End Date: ${item.endDate}`
      );

      // Parse the endDate in 'DD/MM/YYYY' format
      const endDate = moment(item.endDate, "DD/MM/YYYY");

      if (!endDate.isValid()) {
        return console.log(
          `Invalid endDate format for ${item.name}: ${item.endDate}`
        );
      }

      console.log(`Parsed End Date: ${endDate.format("DD/MM/YYYY")}`);

      // Fetch the document template
      let findDocData = await DistributorTemplate.findOne({
        custCode: item.custCode,
        docType: item.docType,
      });

      console.log(`Document data for ${item.name}:`, findDocData);

      // Check if the endDate is exactly one month from today using .add(1, 'month')
      const oneMonthLater = moment().add(1, "months");
      console.log(
        `Checking if ${endDate.format(
          "DD/MM/YYYY"
        )} is exactly one month from today (${oneMonthLater.format(
          "DD/MM/YYYY"
        )})`
      );

      // Adjust to handle month-end cases
      if (endDate.isSame(oneMonthLater, "day")) {
        console.log(`Sending email to ${item.email}`);

        // Call the sendEmail function
        sendEmail(
          item.email, // Distributor's email address
          "Reminder: Your Document End Date is Approaching",
          `Document of ${item.name}, is about to expire on ${item.endDate}.`,
          item._id,
          findDocData
        );
      } else {
        console.log(`End date for ${item.name} is not exactly one month away.`);
      }
    });
  } catch (error) {
    console.log(error, "Error in distributor cron job");
  }
}

// Cron job scheduler
function distributorEndDateCron() {
  cron.schedule("0 * * * *", distributorCronTask); // Runs every minute
}

module.exports = distributorEndDateCron;
