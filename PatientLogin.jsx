import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './patient-login.css';

const PatientLogin = () => {
    const [mobile, setMobile] = useState('');
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!mobile) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('http://localhost:5000/api/patients');
            const patient = res.data.find(p => p.contact === mobile);
            
            if (patient) {
                setPatientData(patient);
            } else {
                setError('No reports found for this mobile number.');
                setPatientData(null);
            }
        } catch (err) {
            setError('Failed to fetch data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (filename) => {
        window.open(`http://localhost:5000/api/reports/download/${filename}`, "_blank");
    };

    return (
        <div className="patient-login-container">
            <div className="login-content-wrapper">
                <div className="patient-login-left">
                    <div className="left-icon-circle">
                        🩺
                    </div>
                    
                    <div className="left-text-area">
                        <p>We at Sairam Diagnostic are always fully focused on helping your health.</p>
                    </div>

                    <img 
                        src="file:///C:/Users/acer/.gemini/antigravity/brain/53bd6352-c4c7-4660-8042-f1294e610ae3/patient_login_medicare_style_illustration_1777044706299.png" 
                        alt="3D Stethoscope Illustration" 
                        className="login-illustration"
                    />
                </div>

                <div className="patient-login-right">
                    <div className="login-header-row">
                        <h1>Patient Login</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src="/logo.png" alt="Sairam Logo" className="client-logo" />
                            <span style={{ fontWeight: '700', color: '#2e7d32', fontSize: '1rem' }}>SAIRAM LABS</span>
                        </div>
                    </div>

                    <div className="login-form-box">
                        <input 
                            type="text" 
                            className="patient-input-field"
                            placeholder="Enter The Mobile Number" 
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        
                        <div className="disclaimer-row">
                            <span className="disclaimer-link">Read Disclaimer</span>
                        </div>

                        <button 
                            className="view-reports-btn" 
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            {loading ? 'Searching...' : 'View Reports'}
                        </button>

                        {error && <p style={{ color: '#e91e63', marginTop: '25px', fontWeight: '500', textAlign: 'center' }}>{error}</p>}

                        {patientData && (
                            <div className="reports-results-container">
                                <div className="report-section">
                                    <h3>Patient Details: {patientData.name}</h3>
                                    <div className="report-card" style={{ background: '#f1f5f9' }}>
                                        <div className="report-info">
                                            <p style={{ margin: 0 }}>UID: {patientData.patient_uid} | 📱 {patientData.contact}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="report-section">
                                    <h3>Available Reports</h3>
                                    {patientData.reports && patientData.reports.length > 0 ? (
                                        patientData.reports.map((report, idx) => (
                                            <div key={idx} className="report-card">
                                               <div className="report-info">
                                                   <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{report.test_name || 'Diagnostic Report'}</h4>
                                                   <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#64748b' }}>{report.date}</p>
                                               </div>
                                               <a 
                                                   href="#" 
                                                   className="download-report-icon"
                                                   onClick={(e) => { e.preventDefault(); handleDownload(report.filename); }}
                                               >
                                                   📥 Download Report
                                               </a>
                                            </div>
                                        ))
                                    ) : <p className="no-reports">No medical records found.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientLogin;
