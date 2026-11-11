import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import './dashboard.css';

const SuperAdmin = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [patients, setPatients] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [activeTab, setActiveTab] = useState('reports');
    const [stats, setStats] = useState({
        totalPatients: 0,
        totalAdmins: 0,
        pendingTests: 0,
        completedReports: 0
    });
    
    // Modals state
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentPatient, setCurrentPatient] = useState(null);
    const [vitalsData, setVitalsData] = useState({ temp: '', bp: '', pulse: '', weight: '' });
    const [editData, setEditData] = useState({ name: '', age: '', contact: '', gender: '' });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userData = JSON.parse(userStr);
            if (userData.role !== 'super_admin') {
                navigate('/dashboard');
            }
            setUser(userData);
        } else {
            navigate('/login');
        }

        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            const patientsRes = await axios.get('http://localhost:5000/api/patients');
            const patientsList = patientsRes.data;
            setPatients(patientsList);
            
            const adminsRes = await axios.get('http://localhost:5000/api/users');
            const adminsList = adminsRes.data;
            setAdmins(adminsList);
            
            const pending = patientsList.reduce((acc, p) => acc + (p.tests ? p.tests.filter(t => t.status === 'pending').length : 0), 0);
            const completed = patientsList.reduce((acc, p) => acc + (p.reports ? p.reports.length : 0), 0);
            
            setStats({
                totalPatients: patientsList.length,
                totalAdmins: adminsList.length, 
                pendingTests: pending,
                completedReports: completed
            });
        } catch (err) {
            console.error("Error fetching data", err);
        }
    };

    const handleToggleAdminStatus = async (uid, currentStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/users/${uid}/status`, { isActive: !currentStatus });
            fetchData();
        } catch (err) {
            alert("Failed to update admin status");
        }
    };

    const handleResetAdminPassword = async (uid) => {
        const newPassword = prompt("Enter new password for this admin:");
        if (!newPassword) return;
        try {
            await axios.put(`http://localhost:5000/api/users/${uid}/reset-password`, { password: newPassword });
            alert("Password reset successfully");
        } catch (err) {
            alert("Failed to reset password");
        }
    };

    const handleDownload = (filename) => {
        window.open(`http://localhost:5000/api/reports/download/${filename}`, "_blank");
    };

    // Vitals Logic
    const openVitalsModal = (patient) => {
        setCurrentPatient(patient);
        setVitalsData(patient.vitals || { temp: '', bp: '', pulse: '', weight: '' });
        setShowVitalsModal(true);
    };

    const saveVitals = async () => {
        try {
            await axios.put(`http://localhost:5000/api/patients/${currentPatient.id}`, {
                ...currentPatient,
                vitals: vitalsData
            });
            setShowVitalsModal(false);
            fetchData();
        } catch (err) {
            alert("Failed to save vitals");
        }
    };

    // Edit Patient Logic
    const openEditModal = (patient) => {
        setCurrentPatient(patient);
        setEditData({
            name: patient.name,
            age: patient.age,
            contact: patient.contact,
            gender: patient.gender || 'Male'
        });
        setShowEditModal(true);
    };

    const savePatientEdit = async () => {
        try {
            await axios.put(`http://localhost:5000/api/patients/${currentPatient.id}`, {
                ...currentPatient,
                ...editData
            });
            setShowEditModal(false);
            fetchData();
        } catch (err) {
            alert("Failed to update patient details");
        }
    };

    const Icons = {
        Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
        Shield: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
        Flask: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M10 9h4M10 3v6l-4 8a2.1 2.1 0 0 0 2 3h8a2.1 2.1 0 0 0 2-3l-4-8V3"></path></svg>,
        FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
        Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
        Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
        UserCog: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M12.91 20.59a3.3 3.3 0 0 0 4.18 0"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    };

    return (
        <div className="dashboard-page">
            <Navbar />
            <main className="gtake-main">
                <div className="gtake-welcome">
                    <div>
                        <h1 className="lab-title">Laboratory Management System</h1>
                        <p>Super Admin Overview & Diagnostic Queue</p>
                    </div>
                    <div className="system-status">
                        <span className="status-indicator"></span>
                        <span className="status-text">System Active</span>
                    </div>
                </div>

                <div className="stats-row">
                    <div className="stat-box">
                        <div className="stat-header">
                            <Icons.Users />
                            <span>Total Patients</span>
                        </div>
                        <div className="stat-value">{stats.totalPatients}</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-header">
                            <Icons.Shield />
                            <span>Active Admins</span>
                        </div>
                        <div className="stat-value">{stats.totalAdmins}</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-header">
                            <Icons.Flask />
                            <span>Pending Tests</span>
                        </div>
                        <div className="stat-value highlight-blue">{stats.pendingTests}</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-header">
                            <Icons.FileText />
                            <span>Reports Issued</span>
                        </div>
                        <div className="stat-value">{stats.completedReports}</div>
                    </div>
                </div>

                <div className="tab-navigation" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <button 
                        className={`action-btn ${activeTab === 'reports' ? 'primary' : ''}`} 
                        onClick={() => setActiveTab('reports')}
                    >Diagnostic Queue</button>
                    <button 
                        className={`action-btn ${activeTab === 'users' ? 'primary' : ''}`} 
                        onClick={() => setActiveTab('users')}
                    >User Management</button>
                    <button 
                        className={`action-btn`} 
                        onClick={() => navigate('/template-builder')}
                    >Manage Templates</button>
                </div>

                <div className="lab-content-section">
                    <div className="section-header">
                        <h2>{activeTab === 'reports' ? 'Report Needed' : 'Admin Accounts'}</h2>
                        <div className="section-actions">
                            {activeTab === 'users' && (
                                <button className="action-btn success" style={{ marginRight: '10px' }} onClick={() => navigate('/add-admin')}>+ Add Admin</button>
                            )}
                            <button className="secondary-btn" onClick={() => fetchData()}>Refresh List</button>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="lab-table">
                            <thead>
                                {activeTab === 'reports' ? (
                                    <tr>
                                        <th>Patient Name</th>
                                        <th>Patient ID</th>
                                        <th>Requested Tests</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th>Admin Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {activeTab === 'reports' ? (
                                    patients.map(p => {
                                        const pendingTests = p.tests ? p.tests.filter(t => t.status === 'pending') : [];
                                        const hasReports = p.reports && p.reports.length > 0;
                                        
                                        return (
                                            <tr key={p.id}>
                                                <td className="font-medium">
                                                    {p.name}
                                                    <button className="small-edit-btn" onClick={() => openEditModal(p)}>
                                                        <Icons.Edit />
                                                    </button>
                                                </td>
                                                <td className="text-muted">{p.patient_uid}</td>
                                                <td>
                                                    {p.tests && p.tests.map(t => (
                                                        <span key={t.id} className="test-tag">{t.name}</span>
                                                    ))}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${pendingTests.length > 0 ? 'pending' : 'completed'}`}>
                                                        {pendingTests.length > 0 ? 'Pending Results' : 'Finalized'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    {pendingTests.length > 0 ? (
                                                        <>
                                                            <button className="action-btn primary" onClick={() => openVitalsModal(p)}>
                                                                <Icons.Edit /> Enter Vitals
                                                            </button>
                                                            <button className="action-btn" onClick={() => navigate(`/enter-results?patientId=${p.id}`)}>
                                                                Enter Results
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <button className="action-btn" onClick={() => navigate(`/enter-results?patientId=${p.id}&edit=true`)}>
                                                                <Icons.Edit /> Edit
                                                            </button>
                                                            {hasReports && (
                                                                <button className="action-btn success" onClick={() => handleDownload(p.reports[p.reports.length - 1].filename)}>
                                                                    <Icons.Download /> Report
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    admins.map(admin => (
                                        <tr key={admin.id}>
                                            <td className="font-medium">{admin.name}</td>
                                            <td className="text-muted">{admin.email}</td>
                                            <td className="text-muted">{admin.phone || '-'}</td>
                                            <td>
                                                <span className={`status-badge ${admin.isActive ? 'completed' : 'pending'}`}>
                                                    {admin.isActive ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="actions-cell">
                                                <button 
                                                    className={`action-btn ${admin.isActive ? '' : 'success'}`}
                                                    onClick={() => handleToggleAdminStatus(admin.id, admin.isActive)}
                                                >
                                                    {admin.isActive ? 'Disable' : 'Enable'}
                                                </button>
                                                <button className="action-btn" onClick={() => handleResetAdminPassword(admin.id)}>
                                                    Reset Password
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Vitals Modal */}
            {showVitalsModal && (
                <div className="modal-backdrop">
                    <div className="lab-modal">
                        <h3>Update Patient Vitals</h3>
                        <p>Patient: {currentPatient?.name}</p>
                        <div className="modal-form">
                            <div className="form-row">
                                <div className="form-col">
                                    <label>Temperature (°F)</label>
                                    <input type="text" value={vitalsData.temp} onChange={(e) => setVitalsData({...vitalsData, temp: e.target.value})} />
                                </div>
                                <div className="form-col">
                                    <label>Blood Pressure</label>
                                    <input type="text" value={vitalsData.bp} onChange={(e) => setVitalsData({...vitalsData, bp: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-col">
                                    <label>Pulse Rate</label>
                                    <input type="text" value={vitalsData.pulse} onChange={(e) => setVitalsData({...vitalsData, pulse: e.target.value})} />
                                </div>
                                <div className="form-col">
                                    <label>Weight (kg)</label>
                                    <input type="text" value={vitalsData.weight} onChange={(e) => setVitalsData({...vitalsData, weight: e.target.value})} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowVitalsModal(false)}>Cancel</button>
                            <button className="save-btn" onClick={saveVitals}>Update Vitals</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Patient Details Modal */}
            {showEditModal && (
                <div className="modal-backdrop">
                    <div className="lab-modal">
                        <h3>Edit Patient Details</h3>
                        <p>Updating records for: <strong>{currentPatient?.patient_uid}</strong></p>
                        <div className="modal-form">
                            <div className="form-col">
                                <label>Full Name</label>
                                <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
                            </div>
                            <div className="form-row">
                                <div className="form-col">
                                    <label>Age</label>
                                    <input type="number" value={editData.age} onChange={(e) => setEditData({...editData, age: e.target.value})} />
                                </div>
                                <div className="form-col">
                                    <label>Gender</label>
                                    <select value={editData.gender} onChange={(e) => setEditData({...editData, gender: e.target.value})} className="lab-select">
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-col">
                                <label>Contact Number</label>
                                <input type="text" value={editData.contact} onChange={(e) => setEditData({...editData, contact: e.target.value})} />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                            <button className="save-btn" style={{ background: '#1976d2' }} onClick={savePatientEdit}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .lab-title {
                    font-size: 2.2rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }
                .system-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #f1f5f9;
                    padding: 6px 12px;
                    border-radius: 20px;
                }
                .status-indicator {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                    box-shadow: 0 0 8px #22c55e;
                }
                .status-text {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #475569;
                }
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .stat-box {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .stat-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #64748b;
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-bottom: 10px;
                }
                .stat-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #0f172a;
                }
                .highlight-blue {
                    color: #2563eb;
                }
                .lab-content-section {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    padding: 24px;
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .section-header h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin: 0;
                }
                .table-container {
                    overflow-x: auto;
                }
                .lab-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                .lab-table th {
                    background: #f8fafc;
                    padding: 12px 16px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #64748b;
                    border-bottom: 1px solid #e2e8f0;
                }
                .lab-table td {
                    padding: 16px;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 0.9rem;
                    color: #334155;
                }
                .font-medium { font-weight: 500; color: #0f172a; }
                .text-muted { color: #64748b; }
                
                .small-edit-btn {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    margin-left: 8px;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .small-edit-btn:hover { background: #f1f5f9; color: #2563eb; }
                
                .test-tag {
                    display: inline-block;
                    background: #eff6ff;
                    color: #3b82f6;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    margin-right: 5px;
                    font-weight: 500;
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .status-badge.pending { background: #fff7ed; color: #ea580c; }
                .status-badge.completed { background: #f0fdf4; color: #16a34a; }
                
                .actions-cell {
                    display: flex;
                    gap: 10px;
                }
                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: #475569;
                    transition: 0.2s;
                }
                .action-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
                .action-btn.primary { background: #2563eb; color: white; border-color: #2563eb; }
                .action-btn.primary:hover { background: #1d4ed8; }
                .action-btn.success { background: #16a34a; color: white; border-color: #16a34a; }
                .action-btn.success:hover { background: #15803d; }

                .modal-backdrop {
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .lab-modal {
                    background: white;
                    padding: 32px;
                    border-radius: 20px;
                    width: 550px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    border: 1px solid #e2e8f0;
                }
                .lab-modal h3 { margin: 0 0 8px; color: #0f172a; font-size: 1.5rem; }
                .lab-modal p { color: #64748b; font-size: 0.95rem; margin-bottom: 24px; }
                .modal-form { display: flex; flex-direction: column; gap: 20px; }
                .form-row { display: flex; gap: 20px; }
                .form-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }
                .form-col label { font-size: 0.9rem; font-weight: 600; color: #334155; }
                .form-col input, .lab-select { 
                    padding: 10px 14px; 
                    border-radius: 8px; 
                    border: 1px solid #cbd5e1; 
                    font-family: inherit;
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.2s;
                    background: white;
                }
                .form-col input:focus, .lab-select:focus { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }
                .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
                .cancel-btn { padding: 10px 24px; border-radius: 8px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: 600; color: #475569; }
                .save-btn { padding: 10px 24px; border-radius: 8px; border: none; background: #2563eb; color: white; cursor: pointer; font-weight: 600; }
                .save-btn:hover { background: #1d4ed8; }
            `}} />
        </div>
    );
};

export default SuperAdmin;
