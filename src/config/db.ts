import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_ATLAS_URI;
  if (!mongoUri) {
    throw new Error(
      "MONGO_URI or MONGO_ATLAS_URI environment variable is required"
    );
  }
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected!!!");
};
