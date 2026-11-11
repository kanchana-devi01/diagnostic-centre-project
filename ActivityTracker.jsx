import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const ActivityTracker = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [activityText, setActivityText] = useState('');
  const [activities, setActivities] = useState([
      { id: 1, patient: 'John Doe', text: 'Completed Blood Test and submitted to lab.', date: '2024-04-22 10:30 AM' },
      { id: 2, patient: 'Jane Smith', text: 'MRI scan scheduled for tomorrow.', date: '2024-04-22 11:15 AM' }
  ]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddActivity = (e) => {
      e.preventDefault();
      if (!patientName.trim() || !activityText.trim()) return;
      
      const newActivity = {
          id: Date.now(),
          patient: patientName,
          text: activityText,
          date: new Date().toLocaleString()
      };
      
      setActivities([newActivity, ...activities]);
      setPatientName('');
      setActivityText('');
  };

  const filteredActivities = activities.filter(a => 
      a.patient.toLowerCase().includes(patientName.toLowerCase())
  );

  return (
    <div className="gtake-layout">
      {/* Sidebar */}
      <aside className="gtake-sidebar">
        <div className="gtake-logo">
           <img src="/logo.png" alt="Sairam Diagnostic Centre" />
           Sairam Diagnostic<br/>Centre
        </div>
        <div className="gtake-menu">
           <div className="menu-item" onClick={() => navigate('/dashboard')}>🟦 Dashboard</div>
           {user?.role === 'admin' && (
             <div className="menu-item" onClick={() => navigate('/add-patient')}>📝 Add Patient</div>
           )}
           <div className="menu-item" onClick={() => navigate('/upload-report')}>☁️ Upload</div>
           {user?.role === 'super_admin' && (
             <div className="menu-item" onClick={() => navigate('/enter-results')}>🧪 Enter Results</div>
           )}
           <div className="menu-item active" onClick={() => navigate('/activity')}>📊 Activity</div>
        </div>
        <div className="gtake-bottom-menu">
           <div className="menu-item">⚙️ Settings</div>
           <div className="menu-item logout" onClick={handleLogout}>🚪 Log out</div>
        </div>
      </aside>

      <main className="gtake-main">
        <header className="gtake-header">
           <div className="breadcrumbs">🏠 Home / Activity Tracker</div>
           <div className="header-actions">
              <span className="profile-icon">👨‍⚕️</span>
           </div>
        </header>

        <div className="gtake-welcome">
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                 <h1 className="thick-pink-blue">Activity Tracking</h1>
                 <p>Log and monitor activities for patients in real-time.</p>
              </div>
              <button onClick={() => navigate('/dashboard')} className="home-corner-link" style={{ border: 'none', cursor: 'pointer' }}>
                 🏠 Home
              </button>
           </div>
        </div>

        <div className="gtake-content-grid" style={{ gridTemplateColumns: '1fr' }}>
           <div className="glass-panel main-patient-panel" style={{ marginBottom: '24px' }}>
              <div className="glass-header">
                 <h4>Log New Activity</h4>
              </div>
              
              <form onSubmit={handleAddActivity} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                 <div style={{ display: 'flex', gap: '15px' }}>
                     <input 
                         type="text" 
                         className="smart-search-input" 
                         placeholder="🔍 Type Patient Name..." 
                         value={patientName}
                         onChange={(e) => setPatientName(e.target.value)}
                         style={{ width: '30%', margin: 0, padding: '10px 20px' }}
                     />
                     <input 
                         type="text" 
                         className="smart-search-input" 
                         placeholder="Enter Activity Details..." 
                         value={activityText}
                         onChange={(e) => setActivityText(e.target.value)}
                         style={{ flex: 1, margin: 0, padding: '10px 20px' }}
                     />
                 </div>
                 <button 
                    type="submit" 
                    className="new-task-btn" 
                    style={{ alignSelf: 'flex-start', marginLeft: 0, marginTop: '10px' }}
                 >
                    Log Activity
                 </button>
              </form>
           </div>

           <div className="glass-panel patient-list-panel">
              <h4 className="panel-title">🟢 Recent Activities {patientName ? `for ${patientName}` : ''}</h4>
              <div className="roster-list">
                 {filteredActivities.length > 0 ? filteredActivities.map(activity => (
                    <div key={activity.id} className="roster-item" style={{ cursor: 'default' }}>
                       <div className="roster-info">
                          <h5 style={{ color: '#00BFFF' }}>{activity.patient}</h5>
                          <p style={{ margin: '5px 0', color: '#333' }}>{activity.text}</p>
                          <small style={{ color: '#888' }}>{activity.date}</small>
                       </div>
                    </div>
                 )) : <p className="dim">No activities found.</p>}
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default ActivityTracker;
