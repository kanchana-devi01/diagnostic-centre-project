import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './split-auth.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!agree) {
      setError('You must agree to the Terms & Privacy policy.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password
      });

      setSuccess(res.data.message);
      setTimeout(() => {
         navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="split-wrapper">
      <div className="split-card">
        <div className="split-left">
          <div>
            <div className="left-top-text">You can easily</div>
            <h1>Manage your diagnostics with our Web App</h1>
          </div>
          <div className="partners-section">
            <div className="partners-text">Our partners</div>
            <div className="partners-logos">
              <span>Sairam Med</span>
              <span>HealthCare+</span>
              <span>BioLab</span>
            </div>
          </div>
        </div>
        
        <div className="split-right">
          <h2>Get Started Now</h2>
          <p className="split-subtitle">Create an account to continue.</p>
          
          <form className="split-form" onSubmit={handleSignup}>
            <div className="input-group">
              <label htmlFor="signup-name">Name</label>
              <div className="input-wrapper">
                <input 
                  id="signup-name"
                  type="text" 
                  className="split-input"
                  placeholder="Enter your name..." 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="signup-email">Email address</label>
              <div className="input-wrapper">
                <input 
                  id="signup-email"
                  type="email" 
                  className="split-input"
                  placeholder="workmail@gmail.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="signup-password">Password</label>
              <div className="input-wrapper">
                <input 
                  id="signup-password"
                  type={showPassword ? "text" : "password"} 
                  className="split-input"
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <button 
                  type="button" 
                  className="password-toggle-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="terms-group">
              <input 
                type="checkbox" 
                id="terms" 
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <label htmlFor="terms">I agree to the <a href="#">Terms & Privacy</a></label>
            </div>

            <button type="submit" className="primary-btn">Sign up</button>
            
            {error && <p className="error-text">{error}</p>}
            {success && <p className="success-text">{success}</p>}
            
            <div className="auth-switch">
              Have an account? <Link to="/login">Login</Link>
            </div>
            
            <div className="divider">Or</div>
            
            <div className="social-login">
              <button type="button" className="social-btn">
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Sign up with Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
