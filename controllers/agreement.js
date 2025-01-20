const nodemailer = require("nodemailer");
const { default: axios } = require("axios");
const CustomerSchema = require("../models/customer");
const DfMasterSchema = require("../models/df_master");
const TinyURL = require("tinyurl");
const SignAgreementSchema = require("../models/SignAgreementModel");
const { checkSignedDocs, getDocketInfo } = require("./SignAgreementController");
const { base64ToS3 } = require("../utils/base64ToS3");

exports.sendAadharLinkViaOtp = async (req, res) => {
  const { radioText, custId, template, assetsId, oldCustomerId } = req.body;

  try {
    const [customerData, dfMasterData] = await Promise.all([
      CustomerSchema.findById(custId).lean().exec(),
      DfMasterSchema.findById(assetsId).lean().exec(),
    ]);

    let custCode = customerData.custCode;
    let custName = customerData.custName;
    let dfModel = dfMasterData.materialDescriptionHOCCO;

    let ourLink;

    if (oldCustomerId !== undefined) {
      ourLink = `http://91.108.104.238/aadharVerify/${radioText}/${custId}/${template}/${assetsId}/${oldCustomerId}`;
    } else {
      ourLink = `http://91.108.104.238/aadharVerify/${radioText}/${custId}/${template}/${assetsId}/${0}`;
    }

    const transporter = nodemailer.createTransport({
      service: "Hotmail",
      auth: {
        user: process.env.DF_EMAIL,
        pass: process.env.DF_PASS,
      },
    });

    const mailOptions = {
      from: '"No Reply" sales.report@hocco.in',
      to: customerData && customerData.custEmailID,
      subject: `Agreement Link (${custName}) (${dfMasterData.assetSerialNumber}) `,
      text: `Verify your aadhar details here on this Link : ${ourLink}`,
    };

    try {
      transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
          return res.status(400).json({ err, success: false });
        } else {
          return res.status(200).json({
            error: false,
            message: `Link sent to your Email-Id.`,
            success: true,
          });
        }
      });
    } catch (error) {
      return res.status(400).json({ error, success: false });
    }

    let link;

    TinyURL.shorten(ourLink)
      .then(async (shortenedUrl) => {
        let newUrl = shortenedUrl && shortenedUrl.split("tinyurl.com/");

        link = `http://164.52.195.161/API/SendMsg.aspx?uname=20240162&pass=D9snM9w9&send=HOCICE&dest=6353611517&msg=Dear Hocco Dealer,%0AClick on below link for Aadhar (Digital) validation for DF agreement generation.%0ACust. Code:- ${custCode}%0ACust. Name:- ${custName}%0ADF Model:- ${dfModel}%0ASerial Number:- ${dfMasterData.assetSerialNumber}%0ALink:- https://tinyurl.com/${newUrl[1]}%0AHocco Ice Cream`;

        const response = await axios.post(link);

        if (response && response.data && response.data !== "") {
          return res.status(200).json({
            error: false,
            message: `Link sent to your registered phone number`,
            success: true,
          });
        } else {
          return res.status(400).json({
            error: true,
            message: `Error in data`,
            success: false,
          });
        }
        console.log("Shortened URL:", shortenedUrl);
      })
      .catch((err) => {
        console.error("Error shortening the URL:", err);
      });

    // link = `https:prpsms.co.in/API/SendMsg.aspx?uname=20240162&pass=D9snM9w9&send=HOCICE&dest=${customerData?.contactPersonMobile}&msg=Dear Hocco Dealer,%0AClick on below link for Digital validation for DF agreement generation.%0ACust. Code:${custCode}%0ACust. Name:${custName}%0ADF Model:${dfModel}%0ASerial Number:${dfMasterData.assetSerialNumber}%0ALink:- ${shortUrl}%0AHocco Ice Cream`;

    // shortUrl.short(ourLink, async function (err, url) {
    //   console.log(url, "url=============")

    // });
  } catch (error) {
    console.log(error, "error===========");
  }
};

exports.sendAllSignAgreement = async (req, res) => {
  try {
    const now = new Date();
    const twentyOneHoursAgo = new Date(now.getTime() - 22 * 60 * 60 * 1000); // Last 21 hours

    console.log("1111");
    const signedAgreements = await SignAgreementSchema.find({
      createdAt: { $gte: twentyOneHoursAgo },
    });

    if (!signedAgreements.length) {
      return res.status(200).json({ message: "No agreements to process." });
    }

    console.log("22222");

    // Prepare transporter once to avoid multiple instances
    const transporter = nodemailer.createTransport({
      service: "Hotmail",
      auth: {
        user: process.env.DF_EMAIL,
        pass: process.env.DF_PASS,
      },
    });

    console.log("33333");

    // Helper function to process a chunk of agreements
    const processChunk = async (chunk) => {
      const promises = chunk.map(async (item) => {
        try {
          // Check signed documents
          const checkData = await checkSignedDocs(item.res_document_id, item.res_docket_id);

          console.log("44444");

          const allSignedInfo = checkData?.signer_info?.[0]?.status === "signed";
          console.log("55555");

          if (!allSignedInfo) return null; // Skip if not all are signed

          console.log("66666");

          // Get new base64 data for signed document
          const getNewBase64Data = await getDocketInfo(item.res_document_id, item.res_docket_id);

          console.log("777777");

          const base64Data = getNewBase64Data?.docket_Info?.[0]?.content || item.documentBase64;
          console.log("8888888");

          // Upload document if base64 is available
          let docLink = base64Data
            ? await base64ToS3(base64Data, { _id: item._id, code: item.custCode })
            : item.documentBase64;

          console.log("9999999");

          // Update sign status and documentBase64
          const signedData = await SignAgreementSchema.findByIdAndUpdate(
            item._id,
            { signStatus: "S", documentBase64: docLink },
            { new: true }
          );

          // Fetch customer only if signing was successful
          const findCustomer = await CustomerSchema.findOne({ custCode: item.custCode });
          if (!findCustomer) {
            throw new Error(`Customer with code ${item.custCode} not found`);
          }

          console.log("1010101");

          // Prepare email data
          const emailArray = [findCustomer.tsmVSEEmail, findCustomer.asmEmail].filter(Boolean);
          const email = emailArray.join(", ");
          const mailOptions = {
            from: '"No Reply" sales.report@hocco.in',
            to: email,
            cc: ["harsh.chovatiya@hocco.in", "deval@collabsoftech.com.au"],
            subject: `Signed Agreement by ${findCustomer.custName}-${findCustomer.custCode}`,
            text: `Signed Agreement by ${findCustomer.custName}-${findCustomer.custCode}, Link of the pdf:- ${docLink?.Location}`,
          };

          // Send email notification
          await transporter.sendMail(mailOptions);
          console.log(`Email sent successfully for customer ${findCustomer.custCode}`);

          return signedData;
        } catch (error) {
          console.error(`Error processing agreement with _id ${item._id}:`, error);
          return null;
        }
      });

      return await Promise.all(promises);
    };

    // Process agreements in chunks of 5
    let promiseData = [];
    const chunkSize = 1;
    for (let i = 0; i < signedAgreements.length; i += chunkSize) {
      const chunk = signedAgreements.slice(i, i + chunkSize);
      console.log(`Processing chunk: ${i / chunkSize + 1}`);
      const chunkResults = await processChunk(chunk); // Process each chunk sequentially
      promiseData = promiseData.concat(chunkResults); // Accumulate results
    }

    console.log("Processed agreements:", promiseData);
    res.status(200).json({ message: "Agreements processed successfully." });
  } catch (error) {
    console.error("sendAllSignAgreement error:", error);
    res.status(500).json({ message: "Error processing agreements" });
  }
};