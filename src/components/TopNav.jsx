import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/TopNav.css';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';

export default function TopNav() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await signOut(auth); // ✅ Sign out from Firebase
        navigate('/'); // Redirect to login
      } catch (error) {
        console.error('Logout Error:', error);
        alert('Failed to log out. Please try again.');
      }
    }
  };

  return (
    <div className="nav-card d-flex flex-wrap justify-content-between align-items-center px-2 py-2">
      {/* Left: Navigation buttons */}
      <div className="nav-btn-group flex-grow-1 me-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
        >
          Record
        </NavLink>
        <NavLink
          to="/expenses"
          className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
        >
          Expenses
        </NavLink>
        <NavLink
          to="/sales"
          className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
        >
          Sales
        </NavLink>
      </div>

      {/* Right: Logout button */}
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
