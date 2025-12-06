import express from "express";
import { startListener } from "../ingestion/ethListener.js";

const app = express();

app.get("/health", (req, res) => res.send("OK"));

app.listen(3000, async () => {
  console.log("API running on 3000");
  await startListener();
});
