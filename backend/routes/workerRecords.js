// backend/routes/workerRecords.js
import express from "express";
import Worker from "../models/Worker.js";
import WorkerRecord from "../models/WorkerRecord.js";

const router = express.Router();

// helper: parse date safely
function parseDateOrNull(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

// GET records with filters (name, date, startDate/endDate, sort)
router.get("/", async (req, res) => {
  try {
    const { name, date, startDate, endDate, sort } = req.query;
    const filter = {};

    if (name) {
      const regex = new RegExp(name, "i");
      const matched = await Worker.find({ name: regex }).select("_id").lean();
      if (matched.length) {
        const ids = matched.map(m => m._id);
        filter.$or = [
          { worker: { $in: ids } },
          { workerName: { $regex: name, $options: "i" } }
        ];
      } else {
        filter.workerName = { $regex: name, $options: "i" };
      }
    }

    if (date) {
      const d = parseDateOrNull(date);
      if (d) {
        const start = new Date(d); start.setHours(0,0,0,0);
        const end = new Date(d); end.setHours(23,59,59,999);
        filter.date = { $gte: start, $lte: end };
      }
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const s = parseDateOrNull(startDate);
        if (s) filter.date.$gte = new Date(s.setHours(0,0,0,0));
      }
      if (endDate) {
        const e = parseDateOrNull(endDate);
        if (e) filter.date.$lte = new Date(e.setHours(23,59,59,999));
      }
    }

    const sortObj = { date: sort === "asc" ? 1 : -1 };
    const docs = await WorkerRecord.find(filter)
      .populate("worker", "name dailySalary")
       .sort({ date: -1 })
      .lean();

    res.json(docs);
  } catch (err) {
    console.error("GET /api/workers/records error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST create record
router.post("/", async (req, res) => {
  try {
    const raw = req.body || {};
    const workerId = raw.workerId || null;
    const workerNameRaw = (raw.workerName || raw.name || "").trim();
    const dateStr = raw.date;
    const status = raw.status || "Present";
    const advance = Number(raw.advance ?? raw.advanceTaken ?? raw.advanceAmount ?? 0);
    const salaryBeforeInput = raw.salaryBefore ?? raw.salary ?? raw.dailySalary ?? 0;
    const salaryBeforeProvided = Number(salaryBeforeInput || 0);

    if (!dateStr) return res.status(400).json({ error: "Date is required" });
    const recordDate = parseDateOrNull(dateStr);
    if (!recordDate) return res.status(400).json({ error: "Invalid date format" });

    if (!workerId && !workerNameRaw) {
      return res.status(400).json({ error: "workerId or workerName required" });
    }

    // find or create worker
    let wk = null;
    if (workerId) {
      wk = await Worker.findById(workerId);
      if (!wk) return res.status(400).json({ error: "Worker not found with provided ID" });
    } else {
      wk = await Worker.findOne({ name: { $regex: `^${workerNameRaw}$`, $options: "i" } });
      if (!wk) {
        wk = new Worker({ name: workerNameRaw, dailySalary: salaryBeforeProvided });
        await wk.save();
      }
    }

    const finalWorkerId = wk._id;
    const finalWorkerName = wk.name;
    const workerDailySalary = Number(wk.dailySalary ?? 0);
    const finalSalaryBefore = salaryBeforeProvided || workerDailySalary || 0;

    // compute salaryAfter & netSalary
    const salaryAfter = finalSalaryBefore - advance;
    const netSalary = status === "Leave" ? 0 : salaryAfter;

    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const dayOfWeek = days[recordDate.getDay()];

    const recordData = {
      worker: finalWorkerId,
      workerName: finalWorkerName,
      date: recordDate,
      dayOfWeek,
      status,
      advance,
      salaryBefore: finalSalaryBefore,
      salaryAfter,
      netSalary
    };

    const rec = new WorkerRecord(recordData);
    await rec.save();

    const out = await WorkerRecord.findById(rec._id)
      .populate("worker", "name dailySalary")
      .lean();

    res.status(201).json(out);
  } catch (err) {
    console.error("POST /api/workers/records error:", err);
    const payload = { error: "Server error" };
    if (err && err.errors) payload.validationErrors = err.errors;
    res.status(500).json(payload);
  }
});

// PUT update a record
router.put("/:id", async (req, res) => {
  try {
    const raw = req.body || {};
    const updates = {};

    if (raw.date) {
      const d = parseDateOrNull(raw.date);
      if (!d) return res.status(400).json({ error: "Invalid date" });
      updates.date = d;
      updates.dayOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
    }
    if (raw.status) updates.status = raw.status;
    if (raw.advance !== undefined) updates.advance = Number(raw.advance);
    else if (raw.advanceTaken !== undefined) updates.advance = Number(raw.advanceTaken);
    else if (raw.advanceAmount !== undefined) updates.advance = Number(raw.advanceAmount);

    if (raw.salaryBefore !== undefined) updates.salaryBefore = Number(raw.salaryBefore);
    else if (raw.salary !== undefined) updates.salaryBefore = Number(raw.salary);

    if (raw.workerId) {
      const wk = await Worker.findById(raw.workerId);
      if (!wk) return res.status(404).json({ error: "Worker not found" });
      updates.worker = wk._id;
      updates.workerName = wk.name;
      if (updates.salaryBefore === undefined) {
        updates.salaryBefore = Number(wk.dailySalary ?? 0);
      }
    }

    const rec = await WorkerRecord.findById(req.params.id);
    if (!rec) return res.status(404).json({ error: "Record not found" });

    Object.assign(rec, updates);

    // recompute salaryAfter & netSalary
    rec.salaryAfter = rec.salaryBefore - rec.advance;
    rec.netSalary = rec.status === "Leave" ? 0 : rec.salaryAfter;

    await rec.save();

    const out = await WorkerRecord.findById(rec._id)
      .populate("worker", "name dailySalary")
      .lean();

    res.json(out);
  } catch (err) {
    console.error("PUT /api/workers/records error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await WorkerRecord.findByIdAndDelete(req.params.id);
    res.json({ message: "Record deleted" });
  } catch (err) {
    console.error("DELETE /api/workers/records error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
