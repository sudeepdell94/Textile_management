import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import api from "../api.js"; // Import your axios instance
import "./Dashboard.css";

export default function Dashboard() {
  const [workersRecords, setWorkersRecords] = useState([]);
  const [productionToday, setProductionToday] = useState([]);
  const [weeklyProduction, setWeeklyProduction] = useState([]);
  const [date, setDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(new Date());

  const formatDate = (d) => d.toISOString().split("T")[0];

  // Fetch worker records for the selected day
  const fetchWorkerRecords = async () => {
    try {
      const d = formatDate(date);
      const res = await api.get(`/workers/records?date=${d}`); // Fixed URL
      const data = res.data;
      // remove duplicates
      const unique = Array.from(
        new Map(data.map(r => [r.workerName + "_" + formatDate(new Date(r.date)), r])).values()
      );
      setWorkersRecords(unique);
    } catch (err) {
      console.error("Error fetching worker records:", err);
    }
  };

  // Fetch production per machine for today
  const fetchProductionToday = async () => {
    try {
      const d = formatDate(date);
      const res = await api.get(`/production/machine?date=${d}`); // Fixed URL
      const data = res.data;
      setProductionToday(data);
    } catch (err) {
      console.error("Error fetching production today:", err);
    }
  };

  // Fetch weekly production (past 3 weeks)
  const fetchWeeklyProduction = async () => {
    try {
      const start = formatDate(weekStart);
      const res = await api.get(`/production/weekly?startDate=${start}`); // Fixed URL
      const data = res.data;
      setWeeklyProduction(data);
    } catch (err) {
      console.error("Error fetching weekly production:", err);
    }
  };

  useEffect(() => {
    fetchWorkerRecords();
    fetchProductionToday();
    fetchWeeklyProduction();
  }, [date, weekStart]);

  // Navigation functions
  const prevDay = () => setDate(new Date(date.setDate(date.getDate() - 1)));
  const nextDay = () => setDate(new Date(date.setDate(date.getDate() + 1)));
  const prevWeek = () => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() - 7)));
  const nextWeek = () => setWeekStart(new Date(weekStart.setDate(weekStart.getDate() + 7)));

  // Summary metrics
  const totalToday = productionToday.reduce((sum, p) => sum + (p.sareesProduced || 0), 0);
  const totalWeek = weeklyProduction.reduce((sum, w) => sum + (w.sareesProduced || 0), 0);
  const workersPresent = workersRecords.filter(r => r.status === "Present").length;

  return (
    <div className="container-fluid py-4 dashboard-container">
      <h1 className="mb-4">Dashboard</h1>

      {/* Summary Cards */}
      <div className="row mb-4 g-3">
        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-success">
            <div className="card-body text-center">
              <h6 className="text-muted">Sarees Today</h6>
              <p className="display-6 text-success">{totalToday}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-primary">
            <div className="card-body text-center">
              <h6 className="text-muted">Weekly Sarees</h6>
              <p className="display-6 text-primary">{totalWeek}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-warning">
            <div className="card-body text-center">
              <h6 className="text-muted">Workers Present</h6>
              <p className="display-6 text-warning">{workersPresent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Production Charts */}
      <div className="row mb-4 g-3">
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-3">Production Per Machine (Today)</h5>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={prevDay}>{"<"}</button>
                <span>{date.toDateString()}</span>
                <button className="btn btn-sm btn-outline-secondary" onClick={nextDay}>{">"}</button>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={productionToday}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sareesProduced" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-3">Weekly Production</h5>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={prevWeek}>{"<"}</button>
                <span>Week of {weekStart.toDateString()}</span>
                <button className="btn btn-sm btn-outline-secondary" onClick={nextWeek}>{">"}</button>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyProduction}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id.date" tickFormatter={d => new Date(d).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip labelFormatter={d => new Date(d).toDateString()} />
                  <Bar dataKey="sareesProduced" fill="#198754" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Workers Table */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Workers List - {date.toDateString()}</h5>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Name</th>
                      <th>Salary Before</th>
                      <th>Advance</th>
                      <th>Salary After</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workersRecords.map(r => (
                      <tr key={r._id}>
                        <td>{r.workerName}</td>
                        <td>₹{r.salaryBefore}</td>
                        <td>₹{r.advance}</td>
                        <td>₹{r.salaryAfter}</td>
                        <td>₹{r.netSalary}</td>
                        <td>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
