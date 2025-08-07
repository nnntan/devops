import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

beforeAll(async () => {
  try {
    console.log("Setting up test database connection...");
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not found in environment variables");
    }

    console.log("Connecting to:", mongoUri);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log("Test database connected successfully!");
  } catch (error) {
    console.error("Test database connection error:", error);
    throw error;
  }
}, 60000);

afterEach(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db!;
      const collections = await db.collections();
      for (let collection of collections) {
        await collection.deleteMany({});
      }
    }
  } catch (error) {
    console.error("Error cleaning up test data:", error);
  }
});

afterAll(async () => {
  try {
    console.log("Cleaning up test database connection...");
    await mongoose.disconnect();
    console.log("Test database disconnected successfully!");
  } catch (error) {
    console.error("Error disconnecting test database:", error);
  }
});
