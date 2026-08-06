import express from "express";
import prisma from "../config/prisma.js";

const router = express.Router();

// GET all workers
router.get("/", async (req, res) => {
  try {
    const workers = await prisma.worker.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" }
    });

    res.json(workers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// CREATE worker
router.post("/", async (req, res) => {
  try {
    const { name, dob, dailySalary } = req.body;

    const worker = await prisma.worker.create({
      data: {
        name: name.trim(),
        dob: dob ? new Date(dob) : null,
        dailySalary: Number(dailySalary || 0)
      }
    });

    res.status(201).json(worker);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// UPDATE worker
router.put("/:id", async (req, res) => {
  try {
    const updated = await prisma.worker.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        ...req.body,
        dailySalary:
          req.body.dailySalary !== undefined
            ? Number(req.body.dailySalary)
            : undefined,
        dob: req.body.dob ? new Date(req.body.dob) : undefined
      }
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// SOFT DELETE
router.delete("/:id", async (req, res) => {
  try {
    await prisma.worker.update({
      where: {
        id: Number(req.params.id)
      },
      data: {
        isActive: false
      }
    });

    res.json({
      message: "Worker deactivated successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;