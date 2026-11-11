import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './forms.css';

const AddPatient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    age: '',
    gender: 'Male',
    contact: ''
  });
  const [assignedTestsList, setAssignedTestsList] = useState([]);
  const [testInput, setTestInput] = useState('');
  const [catalog, setCatalog] = useState([]);          // full catalog from /api/catalog
  const [filteredCatalog, setFilteredCatalog] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredName, setRegisteredName] = useState('');
  const [registeredUid, setRegisteredUid] = useState('');
  const dropdownRef = useRef(null);

  // Fetch catalog on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/catalog');
        setCatalog(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching catalog:', err);
        // Fallback: fetch legacy test-names endpoint
        try {
          const res2 = await axios.get('http://localhost:5000/api/patients/test-names');
          const fallback = res2.data.map(name => ({ id: null, name, category: 'General' }));
          setCatalog(fallback);
        } catch (_) {}
      }
    };
    fetchCatalog();
  }, []);

  // Auto-calculate age when DOB changes
  useEffect(() => {
    if (formData.dob) {
      const today = new Date();
      const dob = new Date(formData.dob);
      if (!isNaN(dob)) {
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        setFormData(prev => ({ ...prev, age: String(Math.max(0, age)) }));
      }
    }
  }, [formData.dob]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTestInputChange = (e) => {
    const val = e.target.value;
    setTestInput(val);
    if (val.trim().length > 0) {
      const q = val.toLowerCase();
      setFilteredCatalog(catalog.filter(t => t.name.toLowerCase().includes(q)));
      setShowDropdown(true);
    } else {
      setFilteredCatalog(catalog);
      setShowDropdown(true);
    }
  };

  const handleTestInputFocus = () => {
    setFilteredCatalog(catalog);
    setShowDropdown(true);
  };

  const handleSelectCatalogTest = (test) => {
    if (!assignedTestsList.find(t => t.name === test.name)) {
      setAssignedTestsList([...assignedTestsList, { name: test.name, catalog_id: test.id }]);
    }
    setTestInput('');
    setShowDropdown(false);
  };

  const handleAddCustomTest = () => {
    const trimmed = testInput.trim();
    if (trimmed && !assignedTestsList.find(t => t.name === trimmed)) {
      setAssignedTestsList([...assignedTestsList, { name: trimmed, catalog_id: null }]);
      setTestInput('');
      setShowDropdown(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If there's a single exact match, select it; otherwise add as custom
      const exact = catalog.find(t => t.name.toLowerCase() === testInput.trim().toLowerCase());
      if (exact) {
        handleSelectCatalogTest(exact);
      } else {
        handleAddCustomTest();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleRemoveTest = (testName) => {
    setAssignedTestsList(assignedTestsList.filter(t => t.name !== testName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // If there's leftover text in the input, try to add it
    if (testInput.trim()) {
      const exact = catalog.find(t => t.name.toLowerCase() === testInput.trim().toLowerCase());
      if (exact) {
        if (!assignedTestsList.find(t => t.name === exact.name)) {
          assignedTestsList.push({ name: exact.name, catalog_id: exact.id });
        }
      } else if (!assignedTestsList.find(t => t.name === testInput.trim())) {
        assignedTestsList.push({ name: testInput.trim(), catalog_id: null });
      }
    }

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
      // Send test names as comma-separated string (backend handles it)
      submitData.append('assigned_tests', assignedTestsList.map(t => t.name).join(', '));
      if (photoFile) submitData.append('photo', photoFile);

      const res = await axios.post('http://localhost:5000/api/patients', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setRegisteredName(formData.name);
      setRegisteredUid(res.data.patient_uid);
      setShowSuccessModal(true);

      setFormData({ name: '', dob: '', age: '', gender: 'Male', contact: '' });
      setAssignedTestsList([]);
      setTestInput('');
      setPhotoFile(null);

      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/dashboard');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add patient');
    }
  };

  // Group catalog by category for the dropdown
  const groupedCatalog = filteredCatalog.reduce((acc, test) => {
    const cat = test.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(test);
    return acc;
  }, {});

  return (
    <>
      {showSuccessModal && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-icon">✨</div>
            <h2>REGISTRATION COMPLETED</h2>
            <h1 className="rainbow-text-thick">{registeredName}</h1>
            <p>Patient successfully added with ID: <strong>{registeredUid}</strong></p>
            <p style={{ fontSize: '0.8rem', color: '#888' }}>Keep this ID for future search and diagnostics.</p>
          </div>
        </div>
      )}

      <div className="form-container">
        <h2>Add New Patient</h2>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
          </div>

          {/* Date of Birth */}
          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} max={new Date().toISOString().split('T')[0]} />
          </div>

          {/* Age (auto-calculated or manual) */}
          <div className="form-group">
            <label>Age {formData.dob ? <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '0.8rem' }}>(auto-calculated from DOB)</span> : ''}</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required={!formData.dob}
              placeholder="35"
              readOnly={!!formData.dob}
              style={formData.dob ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}}
            />
          </div>

          {/* Gender */}
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          {/* Contact */}
          <div className="form-group">
            <label>Contact Number</label>
            <input type="tel" name="contact" value={formData.contact} onChange={handleChange} required placeholder="+91 98765 43210" />
          </div>

          {/* Tests — catalog-driven */}
          <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
            <label>Tests to Assign</label>
            <div className="test-input-wrapper">
              <input
                type="text"
                placeholder="Search catalog (e.g. CBC, Lipid…)"
                value={testInput}
                onChange={handleTestInputChange}
                onFocus={handleTestInputFocus}
                onKeyDown={handleKeyPress}
                style={{ flex: 1 }}
                autoComplete="off"
              />
              <button type="button" className="test-add-btn" onClick={handleAddCustomTest}>+ Add</button>
            </div>

            {/* Catalog dropdown */}
            {showDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
                background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '260px',
                overflowY: 'auto', marginTop: '4px'
              }}>
                {Object.keys(groupedCatalog).length === 0 && (
                  <div style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '0.85rem' }}>
                    No tests found. Press Enter to add as custom.
                  </div>
                )}
                {Object.entries(groupedCatalog).map(([category, tests]) => (
                  <div key={category}>
                    <div style={{
                      padding: '6px 14px', fontSize: '0.72rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb'
                    }}>{category}</div>
                    {tests.map(test => {
                      const already = assignedTestsList.find(t => t.name === test.name);
                      return (
                        <div
                          key={test.id || test.name}
                          onClick={() => !already && handleSelectCatalogTest(test)}
                          style={{
                            padding: '10px 16px', cursor: already ? 'default' : 'pointer',
                            fontSize: '0.88rem', color: already ? '#9ca3af' : '#111827',
                            background: already ? '#f9fafb' : 'transparent',
                            borderBottom: '1px solid #f3f4f6',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}
                          onMouseEnter={e => { if (!already) e.currentTarget.style.background = '#eff6ff'; }}
                          onMouseLeave={e => { if (!already) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span>{test.name}</span>
                          {already && <span style={{ fontSize: '0.75rem', color: '#10b981' }}>✓ Added</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Assigned test chips */}
            {assignedTestsList.length > 0 && (
              <div className="test-tags-container" style={{ marginTop: '10px' }}>
                {assignedTestsList.map((test) => (
                  <span key={test.name} className="test-tag-chip">
                    {test.name}
                    {test.catalog_id && (
                      <span title="From catalog" style={{ marginLeft: '4px', fontSize: '0.65rem', color: '#6366f1' }}>●</span>
                    )}
                    <button type="button" className="test-tag-remove" onClick={() => handleRemoveTest(test.name)}>&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Profile Photo */}
          <div className="form-group">
            <label>Profile Photo (Optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} style={{ padding: '10px 0' }} />
          </div>

          <button type="submit" className="form-submit-btn">Register Patient</button>
        </form>

        <button className="back-btn" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button>
      </div>
    </>
  );
};

export default AddPatient;
