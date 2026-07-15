import { app, connectMongoDB } from "../artifacts/api-server/dist/vercel-entry.mjs";

export default async function handler(req, res) {
  try {
    await connectMongoDB();
  } catch (err) {
    console.error("MongoDB connection failed in Vercel serverless function:", err);
  }
  return app(req, res);
}
