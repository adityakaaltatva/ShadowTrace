import mongoose from "mongoose";
import { MONGO_URI } from "../config.js";

export async function connectMongo() {
  await mongoose.connect(MONGO_URI);
  console.log("Mongo connected ✔");
}
