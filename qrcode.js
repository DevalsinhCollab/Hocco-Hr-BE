const qr = require("qrcode");
const base64Img = require("base64-img");

// qr.toFile(pngFilePath, textToEncode, { type: 'png' }, (err) => {
//   if (err) throw err;
//   console.log('QR code generated as qrcode.png');

//   // Convert PNG to base64
//   base64Img.base64(pngFilePath, (err, data) => {
//     if (err) throw err;
//     console.log('Base64 representation:', data);

//     // Optionally, you can save the base64 string to a file
//     fs.writeFileSync('qrcode_base64.txt', data, 'utf-8');
//     console.log('Base64 string saved to qrcode_base64.txt');
//   });
// });

async function generateQRCode(textToEncode, fileName) {
  try {
    await qr.toFile(fileName, textToEncode, { type: "png" });
  } catch (err) {
    console.error("Error in QR code generation:", err);
    throw err; // Re-throw the error to propagate it to the caller
  }
}

async function convertPNGtoBase64(pngFilePath) {
  return new Promise((resolve, reject) => {
    base64Img.base64(pngFilePath, (err, data) => {
      if (err) {
        console.error("Error while converting PNG to base64:", err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function run(textToEncode) {
  let string = `Eway Bill: ${textToEncode?.bill}, Date: ${textToEncode?.date}, GST: ${textToEncode?.gst}`;

  // const textToEncode = "Hello, QR Code!";
  const pngFilePath = "qrcode.png";

  try {
    generateQRCode(string, pngFilePath);
    const base64String = convertPNGtoBase64(pngFilePath);

    return base64String;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Re-throw the error to propagate it to the caller
  }
}

module.exports = run;
