import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase/firebase';

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('loggedIn', 'true');
    navigate('/dashboard');
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('businessName', user.displayName || '');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      alert('Google sign-in failed.');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: "21rem", minHeight: "26rem" }}>
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
          <button type="submit" className="btn btn-primary fw-semibold w-100 mb-3">Submit</button>
        </form>

        <button
          className="btn btn-light border d-flex align-items-center justify-content-center gap-2 w-100"
          onClick={handleGoogleSignIn}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            width="20"
            height="20"
          />
          <span className="fw-semibold">Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}
