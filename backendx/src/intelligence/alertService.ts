import { model, Schema } from "mongoose";

const AlertSchema = new Schema(
  {
    wallet: String,
    score: Number,
    reasons: [String],
    events: Array,
  },
  { timestamps: true }
);

export const Alert = model("Alert", AlertSchema);

export async function saveAlert(wallet: string, score: number, reasons: string[], events: any[]) {
  await Alert.create({ wallet, score, reasons, events });
}

export async function getRecentAlerts(limit = 50) {
  return Alert.find().sort({ createdAt: -1 }).limit(limit).lean();
}
