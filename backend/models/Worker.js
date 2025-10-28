// backend/models/Worker.js
import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  dob: { type: Date, default: null },
  dailySalary: { type: Number, default: 0 }, // canonical daily salary
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Worker || mongoose.model("Worker", workerSchema);
