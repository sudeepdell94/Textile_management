// backend/models/WorkerRecord.js
import mongoose from "mongoose";

const workerRecordSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true }, // link to Worker
  workerName: { type: String, required: true, trim: true }, // snapshot
  date: { type: Date, required: true },
  dayOfWeek: {
    type: String,
    enum: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    required: true
  },
  status: { type: String, enum: ["Present", "Leave"], default: "Present" },

  // canonical fields for money:
  advance: { type: Number, default: 0 },          // advance taken
  salaryBefore: { type: Number, required: true }, // daily salary snapshot
  salaryAfter: { type: Number, required: true },  // salaryBefore - advance
  netSalary: { type: Number, required: true },    // final (considering Leave)

  createdAt: { type: Date, default: Date.now }
});

// pre-save to compute dayOfWeek, salaryAfter, netSalary
workerRecordSchema.pre("save", function (next) {
  if (this.date && !this.dayOfWeek) {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    this.dayOfWeek = days[this.date.getDay()];
  }

  this.advance = Number(this.advance || 0);
  this.salaryBefore = Number(this.salaryBefore || 0);

  if (this.status === "Leave") {
    this.salaryAfter = 0;
    this.netSalary  = 0 - this.advance;
  } else {
    this.salaryAfter = this.salaryBefore - this.advance;
    this.netSalary = this.salaryAfter;
  }

  next();
});

export default mongoose.models.WorkerRecord || mongoose.model("WorkerRecord", workerRecordSchema);
