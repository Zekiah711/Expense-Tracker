import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth, provider, db } from '../firebase/firebase';
import { ref, set } from 'firebase/database';
import { useState } from 'react';

export default function Login() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');

  //  Manual login using Firebase Anonymous Auth
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await signInAnonymously(auth);
      const user = result.user;

      // Save business info in Firebase DB
      await set(ref(db, `users/${user.uid}`), {
        businessName,
        contact: emailOrPhone,
        method: 'manual',
        createdAt: new Date().toISOString()
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Manual Sign-In Error:', error);
      alert('Manual sign-in failed. Please try again.');
    }
  };

  //  Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save to DB if first-time user
      await set(ref(db, `users/${user.uid}`), {
        businessName: user.displayName || '',
        email: user.email,
        method: 'google',
        createdAt: new Date().toISOString()
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      alert('Google sign-in failed.');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: '21rem', minHeight: '26rem' }}>
        <h5 className="mb-4 pb-2 fs-4 border-bottom fw-bold">Enter Business Info</h5>

        {/* 🔵 Manual Form Login */}
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

        {/* 🔴 Google Login */}
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
