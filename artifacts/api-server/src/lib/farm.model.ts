import mongoose, { Document, Schema } from "mongoose";

export interface IFarm extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  location: string;
  cropType: string;
  pumpStatus: "ON" | "OFF" | "PAUSED_BY_AI";
  currentMoisture: number;
  waterSavedLiters: number;
  notificationEmail?: string | null;
  notificationPhone?: string | null;
  irrigationEvents: number;
  skippedEvents: number;
  createdAt: Date;
  updatedAt: Date;
}

const FarmSchema = new Schema<IFarm>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    cropType: { type: String, required: true },
    pumpStatus: { type: String, enum: ["ON", "OFF", "PAUSED_BY_AI"], default: "OFF" },
    currentMoisture: { type: Number, default: 45 },
    waterSavedLiters: { type: Number, default: 0 },
    notificationEmail: { type: String, default: null },
    notificationPhone: { type: String, default: null },
    irrigationEvents: { type: Number, default: 0 },
    skippedEvents: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const FarmModel = mongoose.model<IFarm>("Farm", FarmSchema);
