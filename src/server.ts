import dotenv from "dotenv";
import { connectDB } from "./config/db";
import app from "./app";

if (process.env.NODE_ENV !== "production" || !process.env.MONGO_URI) {
  dotenv.config();
}

const PORT = process.env.PORT || 5000;

connectDB().then(() =>
  app.listen(PORT, () =>
    console.log("Server is running on http://localhost:9999/")
  )
);
