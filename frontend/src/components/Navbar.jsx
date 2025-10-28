import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-blue-600 p-4 text-white flex gap-6">
      <Link to="/">Dashboard</Link>
      <Link to="/workers">Workers</Link>
      <Link to="/production">Production</Link>
    </nav>
  );
}

export default Navbar;
