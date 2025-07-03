import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/TopNav.css';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { toast } from 'react-toastify';

export default function TopNav() {
  const navigate = useNavigate();

  const handleLogout = () => {
    const toastId = toast.warning(
      <div>
        Are you sure you want to log out?
        <div className="mt-2 d-flex justify-content-end gap-2">
          <button
            className="btn btn-sm btn-danger"
            onClick={async () => {
              toast.dismiss(toastId);
              try {
                await signOut(auth);
                toast.success('Logged out successfully.');
                navigate('/');
              } catch (error) {
                console.error('Logout Error:', error);
                toast.error('Failed to log out. Please try again.');
              }
            }}
          >
            Yes, Logout
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => toast.dismiss(toastId)}
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
      }
    );
  };

  return (
    <div className="nav-card d-flex flex-wrap justify-content-between align-items-center px-2 py-2">
      {/* Navigation buttons */}
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

      {/* Logout button */}
      {/* <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button> */}
    </div>
  );
}
