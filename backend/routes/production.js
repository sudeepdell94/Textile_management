// backend/routes/production.js
import express from "express";
import Production from "../models/Production.js";

const router = express.Router();

// helper: parse date string YYYY-MM-DD to day start/end
function dayRange(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0,0,0,0);
  const dEnd = new Date(d);
  dEnd.setHours(23,59,59,999);
  return { start: d, end: dEnd };
}

// GET /api/production?machineId=&date=&startDate=&endDate=&sort=asc|desc
router.get("/", async (req, res) => {
  try {
    const { machineId, date, startDate, endDate, sort } = req.query;
    const filter = {};

    if (machineId) filter.machineId = machineId;

    if (date) {
      const { start, end } = dayRange(date);
      filter.date = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = dayRange(startDate).start;
      if (endDate) filter.date.$lte = dayRange(endDate).end;
    }

    const sortObj = { date: (sort === "asc" ? 1 : -1) };
    const docs = await Production.find(filter).sort(sortObj).lean();

    // ensure totalCost exists for older docs
    const out = docs.map(d => {
      d.totalCost = Number(d.sareesProduced || 0) * Number(d.costPerSaree || 0);
      return d;
    });

    res.json(out);
  } catch (err) {
    console.error("GET /api/production error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET Production Per Machine (today or specific day)
router.get("/machine", async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const { start, end } = dayRange(targetDate.toISOString().split("T")[0]);

    const data = await Production.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: "$machineId", sareesProduced: { $sum: "$sareesProduced" }, totalCost: { $sum: "$totalCost" } } },
      { $sort: { _id: 1 } }
    ]);

    res.json(data);
  } catch (err) {
    console.error("GET /production/machine error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET Weekly Production (last 3 weeks)
router.get("/weekly", async (req, res) => {
  try {
    const { startDate } = req.query;
    const end = startDate ? new Date(startDate) : new Date();
    end.setHours(23,59,59,999);

    const start = new Date(end);
    start.setDate(end.getDate() - 21); // past 3 weeks
    start.setHours(0,0,0,0);

    const data = await Production.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { machineId: "$machineId", date: "$date" },
          sareesProduced: { $sum: "$sareesProduced" },
          totalCost: { $sum: "$totalCost" }
        }
      },
      { $sort: { "_id.date": -1 } }
    ]);

    res.json(data);
  } catch (err) {
    console.error("GET /production/weekly error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST create new production record
router.post("/", async (req, res) => {
  try {
    const { machineId, date, sareesProduced, warpingCapacity, costPerSaree, machineStatus } = req.body;

    if (!machineId || !date) {
      return res.status(400).json({ error: "machineId and date are required" });
    }

    const d = new Date(date);
    const dayOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];

    const prod = new Production({
      machineId,
      date: d,
      dayOfWeek,
      machineStatus: machineStatus || "ON",
      warpingCapacity: warpingCapacity === "" ? null : warpingCapacity,
      costPerSaree: Number(costPerSaree || 0),
      sareesProduced: machineStatus === "OFF" ? 0 : Number(sareesProduced || 0),
    });

    await prod.save();
    res.status(201).json(prod);
  } catch (err) {
    console.error("POST /api/production error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update production record
router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };

    // date update
    if (updates.date) {
      const d = new Date(updates.date);
      updates.date = d;
      updates.dayOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
    }

    // machine OFF
    if (updates.machineStatus === "OFF") updates.sareesProduced = 0;

    const existing = await Production.findById(req.params.id);
    const sareesVal = updates.sareesProduced !== undefined ? Number(updates.sareesProduced) : Number(existing.sareesProduced || 0);
    const costVal = updates.costPerSaree !== undefined ? Number(updates.costPerSaree) : Number(existing.costPerSaree || 0);
    updates.totalCost = sareesVal * costVal;

    const updated = await Production.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("PUT /api/production error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Production.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/production error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
