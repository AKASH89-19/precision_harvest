import mongoose from "mongoose";
import { logger } from "./logger";

let isConnected = false;

export function getIsConnected(): boolean {
  return isConnected;
}

export async function connectMongoDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI must be set.");
  }

  await mongoose.connect(uri);
  isConnected = true;
  logger.info("Connected to MongoDB");
}

mongoose.connection.on("error", (err) => {
  logger.error({ err }, "MongoDB connection error");
  isConnected = false;
});
