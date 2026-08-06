import express from "express";
import prisma from "./config/prisma.js";
import cors from "cors";
import dotenv from "dotenv";
import workerRouter from "./routes/workers.js";
import workerRecordRouter from "./routes/workerRecords.js";
import machineRouter from "./routes/production.js"; // keep existing

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());


// mount routers
app.use("/api/workers", workerRouter);                // /api/workers -> workers CRUD
app.use("/api/workers/records", workerRecordRouter);  // /api/workers/records -> records endpoints
app.use("/api/production", machineRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
