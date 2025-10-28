// backend/models/Production.js
import mongoose from "mongoose";

const productionSchema = new mongoose.Schema({
  machineId: { type: String, required: true, trim: true },           // Unique machine identifier
  date: { type: Date, required: true },                               // Supports adding old records
  dayOfWeek: { type: String, enum: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], required: true },
  sareesProduced: { type: Number, default: 0 },                       // Number of sarees produced
  warpingCapacity: { type: Number, default: null },                   // Optional
  costPerSaree: { type: Number, default: 0 },                         // Cost per saree
  totalCost: { type: Number, default: 0 },                             // Computed: sareesProduced * costPerSaree
  machineStatus: { type: String, enum: ["ON","OFF"], default: "ON" }, // Machine status
  createdAt: { type: Date, default: Date.now }
});

// Middleware: compute derived fields before save
productionSchema.pre("save", function(next) {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  // compute dayOfWeek if not provided
  if (this.date && !this.dayOfWeek) {
    this.dayOfWeek = days[this.date.getDay()];
  }

  // if machine is OFF, sareesProduced should be 0
  if (this.machineStatus === "OFF") {
    this.sareesProduced = 0;
  } else {
    // ensure sareesProduced is a number
    this.sareesProduced = Number(this.sareesProduced || 0);
  }

  // compute total cost
  this.totalCost = Number(this.sareesProduced) * Number(this.costPerSaree || 0);

  next();
});

export default mongoose.model("Production", productionSchema);
