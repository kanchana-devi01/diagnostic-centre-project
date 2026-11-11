import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './forms.css';

const UploadReport = () => {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);

    try {
      await axios.post('http://localhost:5000/api/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setShowSuccessModal(true);
      setFile(null);
      setPatientId('');

      setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/dashboard');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload report');
    }
  };

  return (
    <>
      {showSuccessModal && (
        <div className="success-overlay">
            <div className="success-modal">
                <div className="success-icon">☁️</div>
                <h2>UPLOAD COMPLETED</h2>
                <h1 className="rainbow-text-thick">SUCCESSFUL</h1>
                <p>Report has been securely uploaded to the system.</p>
            </div>
        </div>
      )}

      <div className="form-container">
        <h2>Upload Patient Report</h2>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Patient ID / Identifier</label>
            <input 
              type="text" 
              value={patientId} 
              onChange={(e) => setPatientId(e.target.value)} 
              required 
              placeholder="e.g. 1001" 
            />
          </div>
          
          <div className="form-group">
            <label>Select Report File (PDF/Image)</label>
            <input 
              type="file" 
              onChange={handleFileChange} 
              required 
              accept=".pdf, .png, .jpg, .jpeg"
              style={{ padding: '10px 0' }}
            />
          </div>
          
          <button type="submit" className="form-submit-btn">Upload Report</button>
        </form>
        
        <button className="back-btn" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button>
      </div>
    </>
  );
};

export default UploadReport;
