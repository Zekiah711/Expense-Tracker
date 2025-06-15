import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Save login flag
    localStorage.setItem('loggedIn', 'true');

    // Redirect to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: "21rem", minHeight: "23rem" }}>
        <h5 className="mb-4 pb-2 fs-4 border-bottom fw-bold">Enter Business Info</h5>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label fw-semibold">Business Name</label>
            <input type="text" className="form-control" required />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Email or Phone Number</label>
            <input type="text" className="form-control" required />
          </div>
          <button type="submit" className="btn btn-primary fw-semibold w-100">Submit</button>
        </form>
      </div>
    </div>
  );
}
