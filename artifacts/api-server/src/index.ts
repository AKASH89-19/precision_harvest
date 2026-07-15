import "dotenv/config";

import app from "./app";
import { logger } from "./lib/logger";
import { connectMongoDB } from "./lib/mongodb";
import { seedIfEmpty } from "./lib/seed";

const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT env var is required. Add PORT=5000 to artifacts/api-server/.env");
}
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  app.listen(port, (err) => {
    if (err) { logger.error({ err }, "Error listening on port"); process.exit(1); }
    logger.info({ port }, "Server listening");
  });
  try {
    await connectMongoDB();
    await seedIfEmpty();
    logger.info("MongoDB connected and seed complete");
  } catch (err) {
    logger.error({ err }, "MongoDB connection failed — check MONGODB_URI in artifacts/api-server/.env");
  }
}

start().catch((err) => { logger.error({ err }, "Failed to start server"); process.exit(1); });
