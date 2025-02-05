const mongoose = require("mongoose");
const env = require("dotenv");

env.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`mongodb connected : ${conn.connection.host}`);

  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;