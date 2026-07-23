import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Workers from "./pages//Workers";
import Production from "./pages//Production";

function App() {
  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand" to="/">Textile Manager</Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/workers">Workers</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/production">Production</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workers" element={<Workers />} />
        <Route path="/production" element={<Production />} />
      </Routes>
    </Router>
  );
}

export default App;
