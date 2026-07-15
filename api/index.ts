import app from "../artifacts/api-server/src/app";
import { connectMongoDB } from "../artifacts/api-server/src/lib/mongodb";

export default async function handler(req: any, res: any) {
  try {
    await connectMongoDB();
  } catch (err) {
    console.error("MongoDB connection failed in Vercel serverless function:", err);
  }
  return (app as any)(req, res);
}
