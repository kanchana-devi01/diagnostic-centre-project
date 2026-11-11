import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './forms.css';

const AddAdmin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await axios.post('http://localhost:5000/api/users', formData);
      
      setShowSuccessModal(true);
      setFormData({ name: '', email: '', phone: '', password: '' });
      
      setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/superadmin');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add admin account');
    }
  };

  return (
    <>
      {showSuccessModal && (
        <div className="success-overlay">
            <div className="success-modal">
                <div className="success-icon">👤</div>
                <h2>ADMIN CREATED</h2>
                <h1 className="rainbow-text-thick">SUCCESSFUL</h1>
                <p>New Admin account for <strong>{formData.name}</strong> has been created.</p>
            </div>
        </div>
      )}

      <div className="form-container">
        <h2>Create New Admin Account</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
            Admins can register patients and assign tests.
        </p>
        
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Full Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="e.g. Dr. Jane Smith" 
            />
          </div>

          <div className="form-group">
            <label>Email / Username</label>
            <input 
              type="email" 
              name="email"
              value={formData.email} 
              onChange={handleChange} 
              required 
              placeholder="admin@sairam.com" 
            />
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <input 
              type="text" 
              name="phone"
              value={formData.phone} 
              onChange={handleChange} 
              required 
              placeholder="9876543210" 
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password} 
              onChange={handleChange} 
              required 
              placeholder="••••••••" 
            />
          </div>
          
          <button type="submit" className="form-submit-btn">Create Admin Account</button>
        </form>
        
        <button className="back-btn" onClick={() => navigate('/superadmin')}>&larr; Back to Dashboard</button>
      </div>
    </>
  );
};

export default AddAdmin;
