import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import workerRouter from "./routes/workers.js";
import workerRecordRouter from "./routes/workerRecords.js";
import machineRouter from "./routes/production.js"; // keep existing

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

app.get("/api/health", (req, res) => {
  const mongoHealthy = mongoose.connection.readyState === 1;

  if (!mongoHealthy) {
    return res.status(503).json({
      status: "unhealthy",
      mongodb: "disconnected",
    });
  }

  res.status(200).json({
    status: "ok",
    mongodb: "connected",
  });
});

// mount routers
app.use("/api/workers", workerRouter); // /api/workers -> workers CRUD
app.use("/api/workers/records", workerRecordRouter); // /api/workers/records -> records endpoints
app.use("/api/production", machineRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
