// src/Production.jsx
import { useState, useEffect } from "react";
import api from "../api.js"; // axios instance with baseURL: http://localhost:5000/api

function getWeekNumber(dt) {
  // simple ISO-like week number (not fully ISO-compliant but good enough for grouping)
  const d = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

const rowClasses = ["", "table-secondary", "table-light", "table-info", "table-success", "table-warning", "table-danger"];

function Production() {
  const [machines, setMachines] = useState([]);
  const [form, setForm] = useState({
    _id: null,
    machineId: "",
    date: new Date().toISOString().slice(0,10), // YYYY-MM-DD
    sareesProduced: "",
    warpingCapacity: "",
    costPerSaree: "",
    machineStatus: "ON"
  });
  const [editing, setEditing] = useState(false);

  const [filter, setFilter] = useState({ machineId: "", date: "" });

  useEffect(() => {
    fetchMachines(); // initial load sorted newest-first
  }, []);

  const fetchMachines = async (filters = {}) => {
    try {
      // build query params
      const params = new URLSearchParams();
      // default sort newest-first (desc)
      params.set("sort", "desc");
      if (filters.machineId) params.set("machineId", filters.machineId);
      if (filters.date) params.set("date", filters.date);
      const res = await api.get(`/production?${params.toString()}`);
      setMachines(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // if toggling machineStatus to OFF, zero sareesProduced in form
    if (name === "machineStatus" && value === "OFF") {
      setForm(f => ({ ...f, machineStatus: value, sareesProduced: 0 }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const resetForm = () => {
    setForm({
      _id: null,
      machineId: "",
      date: new Date().toISOString().slice(0,10),
      sareesProduced: "",
      warpingCapacity: "",
      costPerSaree: "",
      machineStatus: "ON"
    });
    setEditing(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.machineId || !form.date) return alert("Machine ID and date are required.");
    try {
      // convert numeric fields
      const payload = {
        machineId: form.machineId.trim(),
        date: form.date,
        sareesProduced: form.machineStatus === "OFF" ? 0 : Number(form.sareesProduced || 0),
        warpingCapacity: form.warpingCapacity === "" ? null : Number(form.warpingCapacity),
        costPerSaree: Number(form.costPerSaree || 0),
        machineStatus: form.machineStatus
      };
      await api.post("/production", payload);
      resetForm();
      fetchMachines(filter);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (m) => {
    setForm({
      _id: m._id,
      machineId: m.machineId,
      date: new Date(m.date).toISOString().slice(0,10),
      sareesProduced: m.sareesProduced,
      warpingCapacity: m.warpingCapacity || "",
      costPerSaree: m.costPerSaree || "",
      machineStatus: m.machineStatus || "ON"
    });
    setEditing(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form._id) return;
    try {
      const payload = {
        machineId: form.machineId.trim(),
        date: form.date,
        sareesProduced: form.machineStatus === "OFF" ? 0 : Number(form.sareesProduced || 0),
        warpingCapacity: form.warpingCapacity === "" ? null : Number(form.warpingCapacity),
        costPerSaree: Number(form.costPerSaree || 0),
        machineStatus: form.machineStatus
      };
      await api.put(`/production/${form._id}`, payload);
      resetForm();
      fetchMachines(filter);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      await api.delete(`/production/${id}`);
      fetchMachines(filter);
    } catch (err) {
      console.error(err);
    }
  };

  const applyFilter = () => {
    fetchMachines(filter);
  };

  const resetFilter = () => {
    setFilter({ machineId: "", date: "" });
    fetchMachines({});
  };

  // build unique machine list for filter select
  const uniqueMachines = Array.from(new Set(machines.map(m => m.machineId))).sort();

  return (
    <div className="container-fluid py-4">
      <h1 className="mb-4">Production Management</h1>

      {/* Form */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <form onSubmit={editing ? handleUpdate : handleAdd} className="row g-3 align-items-end">
                <div className="col-md-2">
                  <label className="form-label">Machine ID</label>
                  <input type="text" name="machineId" value={form.machineId} onChange={handleChange} className="form-control" placeholder="LM-01" />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Date</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange} className="form-control" />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Machine Status</label>
                  <select name="machineStatus" value={form.machineStatus} onChange={handleChange} className="form-select">
                    <option value="ON">ON</option>
                    <option value="OFF">OFF</option>
                  </select>
                </div>

                <div className="col-md-2">
                  <label className="form-label">Sarees Produced</label>
                  <input type="number" name="sareesProduced" value={form.sareesProduced} onChange={handleChange} className="form-control" disabled={form.machineStatus === "OFF"} placeholder="0" />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Warping Capacity</label>
                  <input type="number" name="warpingCapacity" value={form.warpingCapacity} onChange={handleChange} className="form-control" placeholder="50" />
                </div>

                <div className="col-md-1">
                  <label className="form-label">Cost/Saree</label>
                  <input type="number" name="costPerSaree" value={form.costPerSaree} onChange={handleChange} className="form-control" placeholder="₹" />
                </div>

                <div className="col-md-1 d-grid">
                  <button className={`btn ${editing ? "btn-warning" : "btn-primary"}`} type="submit">
                    {editing ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-3">
        <div className="col-md-3">
          <select className="form-select" value={filter.machineId} onChange={(e) => setFilter(f => ({ ...f, machineId: e.target.value }))}>
            <option value="">Filter by Machine (All)</option>
            {uniqueMachines.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="col-md-3">
          <input type="date" className="form-control" value={filter.date} onChange={(e) => setFilter(f => ({ ...f, date: e.target.value }))} />
        </div>

        <div className="col-md-6 d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={applyFilter}>Apply Filter</button>
          <button className="btn btn-outline-secondary" onClick={resetFilter}>Reset</button>
        </div>
      </div>

      {/* Table */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Machines Production List</h5>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Machine ID</th>
                      <th>Sarees Produced</th>
                      <th>Cost/Saree</th>
                      <th>Total Cost</th>
                      <th>Warping Capacity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machines.length === 0 && (
                      <tr><td colSpan="9" className="text-center text-muted">No records found</td></tr>
                    )}

                    {machines.map((m) => {
                      const d = new Date(m.date);
                      const weekNum = getWeekNumber(d);
                      const cls = rowClasses[(weekNum % rowClasses.length)];
                      const day = m.dayOfWeek || ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
                      const totalCost = m.totalCost !== undefined ? m.totalCost : (Number(m.sareesProduced||0) * Number(m.costPerSaree||0));

                      return (
                        <tr key={m._id} className={cls}>
                          <td>{new Date(m.date).toLocaleDateString()}</td>
                          <td>{day}</td>
                          <td>{m.machineId}</td>
                          <td>{m.sareesProduced}</td>
                          <td>₹{m.costPerSaree}</td>
                          <td>₹{totalCost}</td>
                          <td>{m.warpingCapacity ?? "-"}</td>
                          <td>{m.machineStatus}</td>
                          <td>
                            <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(m)}>Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m._id)}>Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <small className="text-muted mt-2 d-block">Rows colored by week groups for easy weekly scanning.</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Production;
