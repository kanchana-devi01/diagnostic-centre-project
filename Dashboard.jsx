import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import Navbar from './Navbar';
import './dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [user, setUser] = useState(null);
  const [testResultInput, setTestResultInput] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', age: '', contact: '' });
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [recommendedTests, setRecommendedTests] = useState([]);
  const [newTestInput, setNewTestInput] = useState('');

  useEffect(() => {
    const fetchTestNames = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/patients/test-names');
        setRecommendedTests(res.data);
      } catch (err) {
        console.error("Error fetching recommended tests:", err);
      }
    };
    fetchTestNames();
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/patients');
        setPatients(res.data);
        if (res.data.length > 0) setSelectedPatient(res.data[0]);
      } catch (err) {
        console.error("Error fetching patients", err);
      }
    };
    fetchPatients();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDownload = (filename) => {
    window.open(`http://localhost:5000/api/reports/download/${filename}`, "_blank");
  };

  const handlePrint = (filename) => {
    const url = `http://localhost:5000/api/reports/download/${filename}`;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.print();
    };
  };

  const handleUpdateTestResult = async (testId, resultData) => {
    if (!resultData) return;
    try {
      await axios.post('http://localhost:5000/api/reports/result', {
        patient_id: selectedPatient.id,
        test_id: testId,
        result: resultData
      });
      const res = await axios.get('http://localhost:5000/api/patients');
      setPatients(res.data);
      const updatedPatient = res.data.find(p => p.id === selectedPatient.id);
      setSelectedPatient(updatedPatient);
      setTestResultInput({...testResultInput, [testId]: ''});
    } catch (err) {
      console.error("Error updating test result", err);
    }
  };

  const handleAssignNewTest = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !newTestInput.trim()) return;
    try {
      await axios.post(`http://localhost:5000/api/patients/${selectedPatient.id}/assign-test`, {
        test_name: newTestInput.trim()
      });
      const res = await axios.get('http://localhost:5000/api/patients');
      setPatients(res.data);
      const updatedPatient = res.data.find(p => p.id === selectedPatient.id);
      setSelectedPatient(updatedPatient);
      setNewTestInput('');
      
      const testNamesRes = await axios.get('http://localhost:5000/api/patients/test-names');
      setRecommendedTests(testNamesRes.data);
    } catch (err) {
      console.error("Error assigning test:", err);
      alert("Failed to assign test: " + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateTestStatus = async (testId, newStatus) => {
    try {
      await axios.post('http://localhost:5000/api/reports/status', {
        patient_id: selectedPatient.id,
        test_id: testId,
        status: newStatus
      });
      const res = await axios.get('http://localhost:5000/api/patients');
      setPatients(res.data);
      setSelectedPatient(res.data.find(p => p.id === selectedPatient.id));
    } catch (err) {
      console.error("Error updating test status:", err);
      alert("Failed to update status.");
    }
  };


  const handleGenerateSummary = async () => {
      if (!selectedPatient) return;
      try {
          const res = await axios.post('http://localhost:5000/api/reports/summary', {
              patient_id: selectedPatient.id
          });
          handleDownload(res.data.filename);
      } catch (err) {
          console.error("Error generating summary", err);
          alert("Failed to generate report.");
      }
  };

  const handleSavePatient = async () => {
    try {
      await axios.put(`http://localhost:5000/api/patients/${selectedPatient.id}`, editData);
      const res = await axios.get('http://localhost:5000/api/patients');
      setPatients(res.data);
      const updated = res.data.find(p => p.id === selectedPatient.id);
      setSelectedPatient(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      const msg = err.response?.data?.error || "Failed to update patient details.";
      alert(msg);
    }
  };

  const startEditing = () => {
    setEditData({
      name: selectedPatient.name,
      age: selectedPatient.age,
      contact: selectedPatient.contact
    });
    setIsEditing(true);
    setShowEditMenu(false);
  };

  const filteredPatients = patients.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.contact.includes(searchQuery) ||
      (p.patient_uid && p.patient_uid.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalBills = patients.reduce((acc, p) => acc + (p.total_bills || 0), 0);
  const totalReports = patients.reduce((acc, p) => acc + (p.reports ? p.reports.length : 0), 0);

  return (
    <div className="dashboard-page">
      <Navbar />
      <main className="gtake-main">

        <div className="gtake-welcome">
           <div>
              <h1>Sairam Diagnostic Centre</h1>
              <p>Management and planning in a simple and futuristic style will bring you clinical success</p>
           </div>
           
           <div className="smart-search-container">
               <input 
                   type="text" 
                   className="smart-search-input" 
                   placeholder="🔍 Search Patient..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
               />
           </div>

           <div className="filter-pills">
              <span>🟢 Active</span>
              <span>Total Patients: {patients.length}</span>
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <button className="new-task-btn" onClick={() => navigate('/add-patient')}>New Patient</button>
              )}
           </div>
        </div>

        <div className="gtake-content-grid">
           <div className="gtake-fluid-col">
              
              <div className="glass-panel main-patient-panel">
                 <div className="glass-header">
                    <h4>Current Patient Window</h4>
                    <div className="glass-actions" style={{ position: 'relative' }}>
                        📎 
                        <span 
                          style={{ cursor: 'pointer', marginLeft: '10px' }} 
                          onClick={() => setShowEditMenu(!showEditMenu)}
                        >
                          •••
                        </span>
                        {showEditMenu && (
                          <div className="edit-dropdown-menu">
                            <div className="edit-menu-item" onClick={startEditing}>✏️ Edit Details</div>
                          </div>
                        )}
                    </div>
                 </div>
                 
                 {selectedPatient ? (
                   <div className="selected-patient-row">
                      <div className="patient-avatar-large">
                         <img src={selectedPatient.photo_url || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"} alt="avatar"/>
                      </div>
                      <div className="patient-meta-large">
                         {isEditing ? (
                            <div className="edit-patient-form">
                              <input 
                                type="text" 
                                className="edit-input"
                                value={editData.name} 
                                onChange={(e) => setEditData({...editData, name: e.target.value})} 
                                placeholder="Name"
                              />
                              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <input 
                                  type="text" 
                                  className="edit-input"
                                  value={editData.contact} 
                                  onChange={(e) => setEditData({...editData, contact: e.target.value})} 
                                  placeholder="Contact"
                                  style={{ flex: 2 }}
                                />
                                <input 
                                  type="number" 
                                  className="edit-input"
                                  value={editData.age} 
                                  onChange={(e) => setEditData({...editData, age: e.target.value})} 
                                  placeholder="Age"
                                  style={{ flex: 1 }}
                                />
                              </div>
                              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                <button className="save-edit-btn" onClick={handleSavePatient}>Save Changes</button>
                                <button className="cancel-edit-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                              </div>
                            </div>
                         ) : (
                            <>
                              <h3>{selectedPatient.name} <span style={{fontSize: '0.9rem', color: '#666', background: '#eee', padding: '2px 8px', borderRadius: '10px'}}>{selectedPatient.patient_uid}</span></h3>
                              <p>Contact: {selectedPatient.contact} | Age: {selectedPatient.age}</p>
                              
                              {selectedPatient.vitals && (
                                <div className="vitals-row" style={{display: 'flex', gap: '20px', marginTop: '10px', fontSize: '0.85rem', color: '#555'}}>
                                    <span>🌡️ {selectedPatient.vitals.temp || '--'} °F</span>
                                    <span>💓 {selectedPatient.vitals.pulse || '--'} bpm</span>
                                    <span>🩸 {selectedPatient.vitals.bp || '--'} mmHg</span>
                                    <span>⚖️ {selectedPatient.vitals.weight || '--'} kg</span>
                                </div>
                              )}

                              <div className="progress-bar-container" style={{marginTop: '15px'}}>
                                 <span>Diagnostic Progress:</span>
                                 <div className="progress-track"><div className="progress-fill" style={{width: '70%'}}></div></div>
                                 <span className="pct">%70</span>
                              </div>
                            </>
                         )}
                      </div>
                      <div className="pt-qr-area" style={{display: 'none'}}>
                         {/* QR Code removed as requested */}
                      </div>
                   </div>
                 ) : (
                   <p className="dim">No patient selected.</p>
                 )}
              </div>

              <div className="glass-panel patient-list-panel">
                 <h4 className="panel-title">🟢 Enrolled Roster</h4>
                 <div className="roster-list">
                    {filteredPatients.length > 0 ? filteredPatients.map(p => (
                       <div key={p.id} className={`roster-item ${selectedPatient?.id === p.id ? 'active' : ''}`} onClick={() => setSelectedPatient(p)}>
                          <img src={p.photo_url || "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"} alt="pat"/>
                          <div className="roster-info">
                             <h5>{p.name}</h5>
                             <small>{p.patient_uid} • {p.contact}</small>
                          </div>
                          <div className="roster-badges">
                             <span>{p.reports?.length || 0} Files</span>
                             <span className="dot"></span>
                          </div>
                       </div>
                    )) : <p className="dim">No patients found for this search.</p>}
                 </div>
              </div>
           </div>

           <div className="gtake-narrow-col">
              
              <div className="glass-panel note-panel highlight-gradient">
                 <h4>Today note</h4>
                 <p>Reviewing telemetry output for {selectedPatient ? selectedPatient.name : "..."} and finalizing billing operations. 🏀</p>
                 <div className="note-footer">
                    <span>🔔 20min ago</span>
                    <button className="go-btn">✓ I'm going</button>
                 </div>
              </div>

              <div className="glass-panel files-panel">
                 <div className="glass-header">
                    <h4>Reports & Files</h4>
                    <span>•••</span>
                 </div>
                 <div className="files-container">
                    {selectedPatient?.reports?.length > 0 ? (
                       selectedPatient.reports.map((repo, idx) => (
                          <div key={repo.id || idx} className="file-item">
                             <div className="file-icon">📁</div>
                             <span className="file-name">{repo.name.replace('.pdf', '')}</span>
                             <div className="file-actions">
                               <button onClick={() => handleDownload(repo.filename || repo.name)}>⬇️</button>
                               <button onClick={() => handlePrint(repo.filename || repo.name)}>🖨️</button>
                             </div>
                          </div>
                       ))
                    ) : (
                       <div className="empty-files">
                          <div className="hologram-box"></div>
                          <p>You have not added a file yet</p>
                       </div>
                    )}
                  </div>
               </div>

                <div className="glass-panel files-panel">
                   <div className="glass-header">
                      <h4>Assigned Tests</h4>
                   </div>
                   
                   {selectedPatient && (user?.role === 'admin' || user?.role === 'super_admin') && (
                     <form onSubmit={handleAssignNewTest} style={{display: 'flex', gap: '8px', padding: '10px 15px', borderBottom: '1px solid rgba(0,0,0,0.05)'}}>
                       <input 
                         type="text" 
                         placeholder="Assign new test..." 
                         value={newTestInput}
                         onChange={(e) => setNewTestInput(e.target.value)}
                         list="dashboard-recommended-tests"
                         style={{flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', background: 'rgba(255,255,255,0.8)', color: '#333'}}
                       />
                       <datalist id="dashboard-recommended-tests">
                         {recommendedTests.map(name => <option key={name} value={name} />)}
                       </datalist>
                       <button type="submit" style={{background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer'}}>Assign</button>
                     </form>
                   )}

                   <div className="files-container">
                     {selectedPatient?.tests?.length > 0 ? (
                        selectedPatient.tests.map(test => (
                           <div key={test.id} className="file-item" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                              <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                                <span><span className="file-icon">🧪</span> {test.name}</span>
                                <span style={{
                                  fontSize: '0.8rem', 
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  background: test.status === 'Released' ? '#27ae60' : 
                                              test.status === 'Approved' ? '#2980b9' :
                                              test.status === 'Result Entered' ? '#8e44ad' : '#f39c12'
                                }}>
                                  {test.status}
                                </span>
                              </div>
                              {test.status !== 'pending' ? (
                                <div style={{marginTop: '5px', fontSize: '0.9rem', color: '#555', padding: '5px', background: 'rgba(0,0,0,0.02)', borderRadius: '4px', width: '100%'}}>
                                  <div>Result:</div>
                                  {Array.isArray(test.result) ? (
                                    <ul style={{ margin: '5px 0 0 15px', padding: 0 }}>
                                      {test.result.map((r, i) => (
                                        <li key={i}>{r.field}: {r.value} {r.range ? `(${r.range})` : ''}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span>{test.result}</span>
                                  )}
                                  
                                  {/* Pathologist Approval Workflow Actions */}
                                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                    {test.status === 'Result Entered' && (
                                      <button 
                                        onClick={() => handleUpdateTestStatus(test.id, 'Approved')}
                                        style={{background: '#2980b9', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem'}}
                                      >👍 Approve Results</button>
                                    )}
                                    {test.status === 'Approved' && (
                                      <button 
                                        onClick={() => handleUpdateTestStatus(test.id, 'Released')}
                                        style={{background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem'}}
                                      >🚀 Release Report</button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                user?.role === 'super_admin' && (
                                  <div style={{display: 'flex', marginTop: '10px', width: '100%', gap: '5px'}}>
                                    <input 
                                      type="text" 
                                      placeholder="Enter result..." 
                                      value={testResultInput[test.id] || ''}
                                      onChange={(e) => setTestResultInput({...testResultInput, [test.id]: e.target.value})}
                                      style={{flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', background: 'rgba(255,255,255,0.8)', color: '#333'}}
                                    />
                                    <button 
                                      onClick={() => handleUpdateTestResult(test.id, testResultInput[test.id])}
                                      style={{background: '#ff8fb3', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontWeight: 'bold'}}
                                    >Save</button>
                                  </div>
                                )
                              )}
                           </div>
                        ))
                     ) : (
                        <div className="empty-files">
                           <p>No tests assigned</p>
                        </div>
                     )}
                  </div>
               </div>
           </div>
        </div>

        {selectedPatient && user?.role === 'super_admin' && (
            <button className="pdf-button" onClick={handleGenerateSummary}>
                📄 Report Generation
            </button>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
