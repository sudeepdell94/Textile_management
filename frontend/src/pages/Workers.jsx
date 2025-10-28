// src/Workers.jsx
import React, { useState, useEffect } from "react";
import api from "../api.js";

function getWeekNumber(dt) {
  const d = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
const rowClasses = ["", "table-secondary", "table-light", "table-info", "table-success", "table-warning", "table-danger"];

export default function Workers() {
  const [masterWorkers, setMasterWorkers] = useState([]);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    _id: null,
    workerId: "",
    workerName: "",
    date: new Date().toISOString().slice(0,10),
    status: "Present",
    advance: 0,
    salaryBefore: ""
  });
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState({ name: "", date: "" });
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchMasterWorkers();
    fetchRecords({ sort: "desc" });
  }, []);

  const fetchMasterWorkers = async () => {
    try {
      const res = await api.get("/workers");
      setMasterWorkers(res.data || []);
    } catch (err) {
      console.error("fetchMasterWorkers:", err);
    }
  };

  const fetchRecords = async (params = {}) => {
    try {
      const q = new URLSearchParams();
      q.set("sort", params.sort || "desc");
      if (params.name) q.set("name", params.name);
      if (params.date) q.set("date", params.date);
      if (params.startDate) q.set("startDate", params.startDate);
      if (params.endDate) q.set("endDate", params.endDate);

      const res = await api.get(`/workers/records?${q.toString()}`);
      setRecords(res.data || []);
    } catch (err) {
      console.error("fetchRecords:", err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === "workerId") {
      const wk = masterWorkers.find(w => w._id === value);
      setForm(f => ({
        ...f,
        workerId: value,
        workerName: "", // clear manual name when selecting existing
        salaryBefore: wk ? (wk.dailySalary ?? wk.salary ?? "") : ""
      }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const resetForm = () => {
    setForm({
      _id: null,
      workerId: "",
      workerName: "",
      date: new Date().toISOString().slice(0,10),
      status: "Present",
      advance: 0,
      salaryBefore: ""
    });
    setEditing(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.workerId && !form.workerName.trim()) {
      alert("Select existing worker or enter a new worker name.");
      return;
    }
    if (!form.date) {
      alert("Please select a date.");
      return;
    }

    const payload = {
      ...(form.workerId ? { workerId: form.workerId } : { workerName: form.workerName.trim() }),
      date: form.date,
      status: form.status,
      advance: Number(form.advance || 0),
      salaryBefore: Number(form.salaryBefore || 0)
    };

    try {
      await api.post("/workers/records", payload);
      await fetchMasterWorkers();
      await fetchRecords({ sort: "desc" });
      resetForm();
    } catch (err) {
      console.error("Error adding record:", err.response?.data || err);
      alert(err.response?.data?.error || "Failed to add record. See console.");
    }
  };

  const handleEdit = (r) => {
    setForm({
      _id: r._id,
      workerId: r.worker && r.worker._id ? r.worker._id : "",
      workerName: r.workerName || "",
      date: new Date(r.date).toISOString().slice(0,10),
      status: r.status,
      advance: r.advance || 0,
      salaryBefore: r.salaryBefore || 0
    });
    setEditing(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form._id) return;
    const payload = {
      ...(form.workerId ? { workerId: form.workerId } : (form.workerName ? { workerName: form.workerName.trim() } : {})),
      date: form.date,
      status: form.status,
      advance: Number(form.advance || 0),
      salaryBefore: Number(form.salaryBefore || 0)
    };
    try {
      await api.put(`/workers/records/${form._id}`, payload);
      await fetchMasterWorkers();
      await fetchRecords({ sort: "desc" });
      resetForm();
    } catch (err) {
      console.error("Error updating record:", err.response?.data || err);
      alert("Failed to update record.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      await api.delete(`/workers/records/${id}`);
      fetchRecords({ sort: "desc" });
    } catch (err) {
      console.error("Error deleting record:", err);
      alert("Failed to delete record.");
    }
  };

  const handleSearch = () => {
    const t = searchText.trim();
    if (!t) return fetchRecords(filter);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(t)) fetchRecords({ ...filter, date: t });
    else fetchRecords({ ...filter, name: t });
  };

  const applyFilter = () => fetchRecords(filter);
  const resetFilter = () => { setFilter({ name: "", date: "" }); setSearchText(""); fetchRecords({ sort: "desc" }); };

  return (
    <div className="container-fluid py-4">
      <h1 className="mb-4">Workers Management</h1>

      <div className="card mb-3">
        <div className="card-body">
          <form onSubmit={editing ? handleUpdate : handleAdd} className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Worker</label>
              <select className="form-select" name="workerId" value={form.workerId} onChange={handleFormChange}>
                <option value="">-- Select existing --</option>
                {masterWorkers.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
              <div className="form-text">Or enter a new worker name below</div>
              <input name="workerName" className="form-control mt-1" value={form.workerName} onChange={handleFormChange} placeholder="New worker name" />
            </div>

            <div className="col-md-2">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" name="date" value={form.date} onChange={handleFormChange} />
            </div>

            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handleFormChange}>
                <option value="Present">Present</option>
                <option value="Leave">Leave</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Advance (₹)</label>
              <input type="number" className="form-control" name="advance" value={form.advance} onChange={handleFormChange} />
            </div>

            <div className="col-md-2">
              <label className="form-label">Salary (₹)</label>
              <input type="number" className="form-control" name="salaryBefore" value={form.salaryBefore} onChange={handleFormChange} placeholder="daily salary" />
            </div>

            <div className="col-md-1 d-grid">
              <button className={`btn ${editing ? "btn-warning" : "btn-primary"}`} type="submit">{editing ? "Update" : "Add"}</button>
            </div>
          </form>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-3 g-2 align-items-center">
        <div className="col-md-4">
          <input className="form-control" placeholder="Search by name OR YYYY-MM-DD" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </div>
        <div className="col-md-2">
          <button className="btn btn-outline-primary" onClick={handleSearch}>Search</button>
        </div>

        <div className="col-md-3">
          <select className="form-select" value={filter.name} onChange={(e) => setFilter(f => ({ ...f, name: e.target.value }))}>
            <option value="">Filter by name (All)</option>
            {Array.from(new Set(masterWorkers.map(w => w.name))).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="col-md-2">
          <input type="date" className="form-control" value={filter.date} onChange={(e) => setFilter(f => ({ ...f, date: e.target.value }))} />
        </div>

        <div className="col-md-1 d-flex gap-1">
          <button className="btn btn-outline-primary" onClick={applyFilter}>Apply</button>
          <button className="btn btn-outline-secondary" onClick={resetFilter}>Reset</button>
        </div>
      </div>

      {/* Records Table */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-3">Worker Records (newest first)</h5>
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Name</th>
                  <th>Salary</th>
                  <th>Advance</th>
                  <th>Salary After</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 && <tr><td colSpan="9" className="text-center text-muted">No records</td></tr>}
                {records.map(r => {
                  const d = new Date(r.date);
                  const weekNum = getWeekNumber(d);
                  const cls = rowClasses[weekNum % rowClasses.length];
                  return (
                    <tr key={r._id} className={cls}>
                      <td>{d.toLocaleDateString()}</td>
                      <td>{r.dayOfWeek || d.toLocaleDateString('en-US', {weekday: 'short'})}</td>
                      <td>{r.workerName}</td>
                      <td>₹{r.salaryBefore}</td>
                      <td>₹{r.advance}</td>
                      <td>₹{r.salaryAfter}</td>
                      <td style={{ color: r.netSalary < 0 ? 'red' : 'inherit', fontWeight: 600 }}>₹{r.netSalary}</td>
                      <td>{r.status}</td>
                      <td>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(r)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r._id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <small className="text-muted mt-2 d-block">Rows color-coded by week for visual grouping.</small>
        </div>
      </div>
    </div>
  );
}
