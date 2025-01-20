const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Set your access key
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Set your secret key
  region: process.env.AWS_REGION, // Set your AWS region
  httpOptions: {
    timeout: 50000, // Increase timeout to 30 seconds
  },
  maxRetries: 5, // Retry up to 5 times in case of failure
  retryDelayOptions: { base: 200 }, // Exponential backoff for retry delay
});

exports.base64ToS3 = async (
  base64String,
  fileNameData,
  mimeType = "application/pdf"
) => {
  const base64Data =
    base64String && base64String.split(";base64,")
      ? base64String.split(";base64,").pop()
      : base64String;

  const fileBuffer = Buffer.from(base64Data, "base64");

  const { _id, code } = fileNameData;

  let fileName = `${_id}_${code}_${Date.now().toString()}.pdf`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentEncoding: "base64",
    ContentType: mimeType,
  };
  
  return new Promise((resolve, reject) => {
    const upload = s3.upload(params);

    upload.on("httpUploadProgress", (progress) => {
      console.log(
        `Uploaded: ${progress.loaded} of ${progress.total} bytes (${Math.round(
          (progress.loaded / progress.total) * 100
        )}%) for code ${code}`
      );
    });

    // Upload the file to S3
    upload.send((err, data) => {
      if (err) {
        console.error("Error uploading to S3:", err);
        return reject(err); // Reject the promise if there's an error
      }
      console.log(`File uploaded successfully at ${data.Location}`);
      resolve(data); // Resolve the promise with the upload data
    });
  });
};
