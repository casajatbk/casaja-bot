const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("[v0] Connecting to MongoDB...");

    const conn = await mongoose.connect(mongoUri, {
      retryWrites: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[v0] MongoDB Connected: ${conn.connection.host}`);
    console.log(`[v0] Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[v0] Error connecting to MongoDB: ${error.message}`);
    console.error(
      `[v0] Make sure your MONGODB_URI is correct and MongoDB Atlas is accessible`,
    );
    process.exit(1);
  }
};

module.exports = connectDB;
