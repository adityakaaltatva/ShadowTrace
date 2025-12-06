import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema({
  wallet: { type: String, unique: true, index: true },
  tags: [String],
  sanctions: Boolean,
  last_seen: Date,
  tx_count: Number,
  risk_seed: Number,
});

export const WalletProfile = mongoose.model("WalletProfile", WalletSchema);
