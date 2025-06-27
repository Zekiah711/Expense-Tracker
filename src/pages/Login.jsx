import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth, provider, db } from '../firebase/firebase';
import { ref, set } from 'firebase/database';
import { useState } from 'react';


export default function Login() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [authError, setAuthError] = useState('');

  const saveToRxDB = async (userData) => {
    try {
      const dbInstance = await initDatabase();
      await dbInstance.users.upsert(userData);
    } catch (error) {
      console.error('RxDB Save Error:', error);
    }
  };

  // Manual Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await signInAnonymously(auth);
      const user = result.user;

      const userData = {
        uid: user.uid,
        businessName,
        contact: emailOrPhone,
        method: 'manual',
        loginTime: new Date().toISOString()
      };

      await set(ref(db, `users/${user.uid}`), {
        ...userData,
        createdAt: new Date().toISOString()
      });

      await saveToRxDB(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Manual Sign-In Error:', error);
      setAuthError('Manual sign-in failed. Please try again.');
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userData = {
        uid: user.uid,
        businessName: user.displayName || '',
        contact: user.email || '',
        method: 'google',
        loginTime: new Date().toISOString()
      };

      await set(ref(db, `users/${user.uid}`), {
        ...userData,
        createdAt: new Date().toISOString()
      });

      await saveToRxDB(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setAuthError('Unable to sign in with Google. Please try again.');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: '21rem', minHeight: '26rem' }}>
        <h5 className="mb-4 pb-2 fs-4 border-bottom fw-bold">Enter Business Info</h5>

        {authError && (
          <div className="alert alert-danger fw-semibold small text-center">
            {authError}
          </div>
        )}

        {/* Manual Login */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label fw-semibold">Business Name</label>
            <input
              type="text"
              className="form-control"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Email or Phone Number</label>
            <input
              type="text"
              className="form-control"
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary fw-semibold w-100 mb-3">
            Continue
          </button>
        </form>

        {/* Google Login */}
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
