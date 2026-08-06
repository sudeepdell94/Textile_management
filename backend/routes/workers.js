// backend/routes/workers.js
import express from "express";
import Worker from "../models/Worker.js";
import WorkerRecord from "../models/WorkerRecord.js";

const router = express.Router();

// GET all workers (sorted)
router.get("/", async (req, res) => {
  try {
    const workers = await Worker.find().sort({ name: 1 }).lean();
    res.json(workers);
  } catch (err) {
    console.error("GET /api/workers error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST create worker
router.post("/", async (req, res) => {
  try {
    const { name, dob, dailySalary } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const w = new Worker({
      name: name.trim(),
      dob: dob ? new Date(dob) : null,
      dailySalary: Number(dailySalary || 0)
    });
    await w.save();
    res.status(201).json(w);
  } catch (err) {
    console.error("POST /api/workers error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT update worker
router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.dob) updates.dob = new Date(updates.dob);
    if (updates.dailySalary !== undefined) updates.dailySalary = Number(updates.dailySalary);
    const updated = await Worker.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("PUT /api/workers/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE worker (also delete associated records)
router.delete("/:id", async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    await WorkerRecord.deleteMany({ worker: req.params.id });
    res.json({ message: "Worker and associated records deleted" });
  } catch (err) {
    console.error("DELETE /api/workers/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
