import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './dashboard.css';

/* ─────────────────────────────────────────────────────────────
   Utility: check if a numeric result is outside its range
   range string formats: "4.0-5.2" | "4.0 - 5.2" | ">60" | "<200"
   ───────────────────────────────────────────────────────────── */
function isAbnormal(result, range) {
  if (!result || !range) return false;
  const val = parseFloat(result);
  if (isNaN(val)) return false;

  // "min - max"
  const rangeParts = range.match(/^([<>]?)\s*([\d.]+)\s*[-–]\s*([\d.]+)$/);
  if (rangeParts) {
    const [, , minStr, maxStr] = rangeParts;
    return val < parseFloat(minStr) || val > parseFloat(maxStr);
  }
  // ">X"
  const gtMatch = range.match(/^>\s*([\d.]+)$/);
  if (gtMatch) return val <= parseFloat(gtMatch[1]);
  // "<X"
  const ltMatch = range.match(/^<\s*([\d.]+)$/);
  if (ltMatch) return val >= parseFloat(ltMatch[1]);

  return false;
}

const DEFAULT_ROWS = [
  { id: Date.now(),     type: 'section',   title: 'HAEMATOLOGY' },
  { id: Date.now() + 1, type: 'parameter', name: 'Haemoglobin (HB)',         method: 'WB/Automated', result: '', unit: 'g/dl',        range: '12.0-17.5' },
  { id: Date.now() + 2, type: 'parameter', name: 'RBC (Red Blood Cell Count)', method: 'WB/Automated', result: '', unit: 'Million/cmm', range: '4.0-5.9' },
];

const EnterResults = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const patientId   = queryParams.get('patientId');
  const preTestId   = queryParams.get('testId');   // optional: jump straight to a test

  const [patient,     setPatient]     = useState(null);
  const [rows,        setRows]        = useState(DEFAULT_ROWS);
  const [selectedTest, setSelectedTest] = useState(null);  // the test object from patient.tests
  const [isSaving,    setIsSaving]    = useState(false);
  const [saveMsg,     setSaveMsg]     = useState('');

  /* ── fetch patient ── */
  useEffect(() => {
    if (patientId) fetchPatient(patientId);
  }, [patientId]);

  const fetchPatient = async (id) => {
    try {
      const res = await axios.get('http://localhost:5000/api/patients');
      const found = res.data.find(p => p.id === id);
      if (!found) return;
      setPatient(found);

      // Auto-select: prefer the test passed via URL, else first pending test
      const tests = found.tests || [];
      const target = preTestId
        ? tests.find(t => t.id === preTestId)
        : tests.find(t => t.status === 'pending') || tests[0];

      if (target) loadTest(target, found);
    } catch (err) {
      console.error('Error fetching patient', err);
    }
  };

  /* ── load a test's template rows (or previously saved results) ── */
  const loadTest = (test, pat) => {
    setSelectedTest(test);
    const p = pat || patient;

    if (Array.isArray(test.result) && test.result.length > 0) {
      // Already has results — load them for editing
      setRows(test.result);
    } else if (Array.isArray(test.template_rows) && test.template_rows.length > 0) {
      // Fresh — use catalog template
      setRows(test.template_rows.map(r => ({ ...r, id: r.id || String(Date.now() + Math.random()) })));
    } else if (test.catalog_id) {
      // Fetch template from catalog API
      fetchCatalogTemplate(test.catalog_id, p);
    } else {
      setRows(DEFAULT_ROWS);
    }
  };

  const fetchCatalogTemplate = async (catalogId, pat) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/catalog/${catalogId}`);
      const catTest = res.data;
      if (!catTest || !catTest.parameters) { setRows(DEFAULT_ROWS); return; }

      // Determine demographic key
      const age    = pat?.age;
      const gender = (pat?.gender || '').toLowerCase();
      let demoKey  = 'default';
      if (age !== undefined && age < 18) demoKey = 'child';
      else if (gender === 'female') demoKey = 'female';
      else if (gender === 'male')   demoKey = 'male';

      const built = [
        { id: String(Date.now()), type: 'section', title: catTest.name.toUpperCase() },
        ...catTest.parameters.map(p => {
          const ranges = p.reference_ranges || {};
          const r = ranges[demoKey] || ranges['default'] || {};
          let rangeStr = r.display || '';
          if (!rangeStr && r.min !== undefined && r.max !== undefined) rangeStr = `${r.min} - ${r.max}`;
          return {
            id: String(Date.now() + Math.random()),
            type: 'parameter',
            name:   p.name || '',
            method: p.default_method || '',
            result: '',
            unit:   p.unit || '',
            range:  rangeStr,
          };
        }),
      ];
      setRows(built);
    } catch (err) {
      console.error('Error fetching catalog template', err);
      setRows(DEFAULT_ROWS);
    }
  };

  /* ── row edit handlers ── */
  const handleAddRow = (type) => {
    if (type === 'section') {
      setRows(r => [...r, { id: String(Date.now()), type: 'section', title: 'NEW SECTION' }]);
    } else {
      setRows(r => [...r, { id: String(Date.now()), type: 'parameter', name: '', method: '', result: '', unit: '', range: '' }]);
    }
  };
  const handleRowChange = (index, field, value) => {
    setRows(prev => { const n = [...prev]; n[index] = { ...n[index], [field]: value }; return n; });
  };
  const handleRemoveRow = (index) => setRows(r => r.filter((_, i) => i !== index));

  /* ── save / generate report ── */
  const handleSaveReport = async () => {
    if (!patient || !selectedTest) return;
    setIsSaving(true);
    setSaveMsg('');
    try {
      await axios.post('http://localhost:5000/api/reports/generate', {
        patient_id: patient.id,
        test_id:    selectedTest.id,
        results:    rows
      });
      setSaveMsg('✅ Report generated successfully!');
      setTimeout(() => navigate('/superadmin'), 1800);
    } catch (err) {
      setSaveMsg('❌ ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  /* ── icons ── */
  const Icons = {
    Plus:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  };

  const pendingTests  = patient?.tests?.filter(t => t.status === 'pending')   || [];
  const completedTests = patient?.tests?.filter(t => t.status === 'completed') || [];

  return (
    <div className="gtake-layout">
      {/* ── Sidebar ── */}
      <aside className="gtake-sidebar">
        <div className="gtake-logo">
          <img src="/logo.png" alt="Sairam" />
          Laboratory<br />Management
        </div>
        <div className="gtake-menu">
          <div className="menu-item" onClick={() => navigate('/superadmin')}>🟦 Dashboard</div>
          <div className="menu-item active">✍️ Enter Results</div>
          <div className="menu-item" onClick={() => navigate('/add-admin')}>🛡️ Admins</div>
        </div>

        {/* Test selector panel */}
        {patient && (
          <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '12px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Assigned Tests
            </div>
            {[...pendingTests, ...completedTests].map(test => (
              <div
                key={test.id}
                onClick={() => loadTest(test)}
                style={{
                  padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
                  fontSize: '0.8rem', fontWeight: 500,
                  background: selectedTest?.id === test.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                  border: selectedTest?.id === test.id ? '1px solid rgba(99,102,241,0.6)' : '1px solid transparent',
                  color: '#fff',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>{test.name}</span>
                <span style={{
                  fontSize: '0.65rem', padding: '2px 6px', borderRadius: '999px', marginLeft: '4px', flexShrink: 0,
                  background: test.status === 'completed' ? '#064e3b' : '#1e3a8a',
                  color: test.status === 'completed' ? '#6ee7b7' : '#93c5fd'
                }}>
                  {test.status === 'completed' ? '✓ Done' : '⏳ Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <main className="gtake-main">
        <header className="gtake-header">
          <div className="lab-title">
            Report Creation
            {selectedTest && <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280', marginLeft: '12px' }}>— {selectedTest.name}</span>}
          </div>
          <div className="header-actions">
            <button className="secondary-btn" onClick={() => navigate('/superadmin')}>Cancel</button>
            {patient?.reports?.length > 0 && (
              <button className="secondary-btn" style={{ borderColor: '#16a34a', color: '#16a34a' }}
                onClick={() => window.open(`http://localhost:5000/api/reports/download/${patient.reports[patient.reports.length - 1].filename}`, '_blank')}>
                Download Last Report
              </button>
            )}
            <button className="primary-btn" onClick={handleSaveReport} disabled={isSaving || !selectedTest}>
              {isSaving ? 'Generating…' : 'Finalize & Save'}
            </button>
          </div>
        </header>

        {saveMsg && (
          <div style={{
            margin: '0 20px 10px', padding: '10px 16px', borderRadius: '8px',
            background: saveMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
            color: saveMsg.startsWith('✅') ? '#15803d' : '#dc2626',
            fontWeight: 600, fontSize: '0.9rem', border: '1px solid',
            borderColor: saveMsg.startsWith('✅') ? '#bbf7d0' : '#fecaca'
          }}>{saveMsg}</div>
        )}

        {/* ── Letter Pad ── */}
        <div className="letter-pad-container">
          {/* Header */}
          <div className="letter-header">
            <div className="lh-logo"><img src="/logo.png" alt="Lab Logo" /></div>
            <div className="lh-content">
              <h1 className="lh-title">SAIRAM DIAGNOSTIC CENTRE</h1>
              <h2 className="lh-tamil">சாய்ராம் இரத்தப் பரிசோதனை நிலையம்</h2>
              <h3 className="lh-ecg">(ECG ATTACHED)</h3>
              <p className="lh-address">10/1, Bajanai Koil 5th Street, Opposite to Kendra Vidyalaya School, Choolaimedu, Chennai - 600 094.</p>
            </div>
            <div className="lh-contact">
              <div>LandLine : 044-35623983</div>
              <div>Mobile : 9840104871</div>
            </div>
          </div>

          <div className="blue-divider"></div>

          {/* Patient header */}
          <div className="report-header-section">
            <div className="report-header-grid">
              <div className="header-left">
                <div className="header-field">
                  <span className="label">Name:</span>
                  <input className="val-input name-val" value={patient?.name || ''} onChange={e => setPatient({ ...patient, name: e.target.value })} />
                </div>
                <div className="header-field">
                  <span className="label">PID:</span>
                  <input className="val-input" value={patient?.patient_uid || ''} readOnly />
                </div>
                <div className="header-field">
                  <span className="label">Age / Sex:</span>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <input className="val-input" style={{ width: '40px' }} value={patient?.age || ''} readOnly />
                    <span className="label">Y /</span>
                    <input className="val-input" style={{ width: '80px' }} value={patient?.gender || ''} readOnly />
                  </div>
                </div>
                <div className="header-field">
                  <span className="label">Referrer:</span>
                  <input className="val-input" defaultValue="SAI RAM DIAGNOSTIC CENTRE" />
                </div>
              </div>
              <div className="header-right">
                <div className="header-field">
                  <span className="label">SID No:</span>
                  <input className="val-input" defaultValue="03018056" />
                </div>
                <div className="header-field">
                  <span className="label">Reg Date:</span>
                  <input className="val-input" defaultValue={new Date().toLocaleString()} />
                </div>
                <div className="header-field">
                  <span className="label">Coll Date:</span>
                  <input className="val-input" defaultValue={new Date().toLocaleString()} />
                </div>
                <div className="header-field">
                  <span className="label">Report Date:</span>
                  <input className="val-input" defaultValue={new Date().toLocaleString()} />
                </div>
              </div>
            </div>
          </div>

          <div className="report-title-center">Final Test Report</div>

          {/* Results table */}
          <div className="results-table-wrapper">
            <table className="letterpad-table">
              <thead>
                <tr>
                  <th>INVESTIGATION / METHOD</th>
                  <th>RESULT</th>
                  <th>UNITS</th>
                  <th>BIOLOGICAL REFERENCE INTERVAL</th>
                  <th style={{ width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) =>
                  row.type === 'section' ? (
                    <tr key={row.id} className="lp-section-row">
                      <td colSpan="4">
                        <input className="lp-section-input" value={row.title} onChange={e => handleRowChange(index, 'title', e.target.value)} />
                      </td>
                      <td>
                        <button className="lp-delete-btn" onClick={() => handleRemoveRow(index)}><Icons.Trash /></button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id} style={isAbnormal(row.result, row.range) ? { background: '#fff7ed' } : {}}>
                      <td className="lp-param-cell">
                        <input className="lp-input-bold" value={row.name}   onChange={e => handleRowChange(index, 'name',   e.target.value)} placeholder="Parameter" />
                        <input className="lp-input-sub"  value={row.method} onChange={e => handleRowChange(index, 'method', e.target.value)} placeholder="( Method : ... )" />
                      </td>
                      <td>
                        <input
                          className="lp-input-result"
                          value={row.result}
                          onChange={e => handleRowChange(index, 'result', e.target.value)}
                          placeholder="Result"
                          style={isAbnormal(row.result, row.range) ? { color: '#dc2626', fontWeight: 900 } : {}}
                        />
                        {isAbnormal(row.result, row.range) && (
                          <div style={{ fontSize: '0.62rem', color: '#dc2626', fontWeight: 700, marginTop: '1px' }}>⚠ ABNORMAL</div>
                        )}
                      </td>
                      <td>
                        <input className="lp-input-std" value={row.unit}  onChange={e => handleRowChange(index, 'unit',  e.target.value)} placeholder="Units" />
                      </td>
                      <td>
                        <input className="lp-input-std" value={row.range} onChange={e => handleRowChange(index, 'range', e.target.value)} placeholder="Interval" />
                      </td>
                      <td>
                        <button className="lp-delete-btn" onClick={() => handleRemoveRow(index)}><Icons.Trash /></button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="letter-footer">
            <div className="blue-divider"></div>
            <div className="footer-hours"><strong>Working Hours :</strong> Morning 7.00 AM to 1.30 PM <strong>Evening:</strong> 6.30 p.m. to 9.00 PM</div>
            <div className="footer-sunday"><strong>Sunday:</strong> 7.00 AM to 2.00 PM.</div>
            <div className="footer-promo">★ DIABETIC CHAPPALS AVAILABLE ★</div>
          </div>
        </div>

        {/* Controls */}
        <div className="table-controls">
          <button className="lp-add-btn" onClick={() => handleAddRow('parameter')}><Icons.Plus /> Add Parameter</button>
          <button className="lp-add-btn" onClick={() => handleAddRow('section')}><Icons.Plus /> Add Section Title</button>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .letter-pad-container {
          background: white; width: 210mm; min-height: 297mm; padding: 10px;
          margin: 20px auto; border: 1px solid #ddd;
          box-shadow: 0 5px 25px rgba(0,0,0,0.1); position: relative;
          box-sizing: border-box; display: flex; flex-direction: column;
        }
        @media print {
          @page { size: A4; margin: 0; }
          body, html { margin: 0; padding: 0; width: 210mm; height: 297mm; }
          .gtake-layout, .gtake-main { display: block; margin: 0; padding: 0; }
          .gtake-sidebar, .gtake-header, .table-controls, .secondary-btn, .primary-btn { display: none !important; }
          .letter-pad-container { margin: 0; border: none; box-shadow: none; width: 210mm; min-height: 297mm; }
        }
        .letter-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 5px; }
        .lh-logo { width: 120px; }
        .lh-logo img { width: 100%; height: auto; border-radius: 50%; }
        .lh-content { flex: 1; text-align: center; padding: 0 20px; }
        .lh-title { font-size: 1.8rem; font-weight: 800; color: #1e40af; margin: 0; }
        .lh-tamil { font-size: 1.1rem; color: #1e40af; margin: 5px 0; }
        .lh-ecg { font-size: 1rem; color: #1e40af; margin: 5px 0; font-weight: 700; }
        .lh-address { font-size: 0.75rem; color: #1e40af; margin: 5px 0; line-height: 1.4; }
        .lh-contact { font-size: 0.8rem; font-weight: 700; color: #1e40af; text-align: right; }
        .blue-divider { height: 2px; background: #1e40af; margin: 5px 0 15px; }
        .report-header-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; margin-bottom: 20px; }
        .header-field { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .label { font-size: 0.85rem; font-weight: 600; color: #333; min-width: 80px; }
        .val-input { border: none; background: transparent; font-weight: 800; font-size: 0.85rem; width: 100%; padding: 2px 4px; }
        .val-input:hover { background: #f0f4ff; border-radius: 4px; }
        .name-val { font-size: 1.1rem; text-transform: uppercase; }
        .report-title-center { text-align: center; font-weight: 700; font-size: 1rem; margin: 20px 0; text-transform: uppercase; }
        .results-table-wrapper { margin-top: 10px; flex-grow: 1; }
        .letterpad-table { width: 100%; border-collapse: collapse; }
        .letterpad-table th { border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 8px; font-size: 0.75rem; text-align: left; }
        .letterpad-table td { padding: 6px 8px; vertical-align: top; }
        .lp-section-row { background: #f8fbff; }
        .lp-section-input { width: 100%; border: none; background: transparent; font-weight: 800; font-size: 1rem; text-transform: uppercase; color: #000; }
        .lp-param-cell { display: flex; flex-direction: column; gap: 2px; }
        .lp-input-bold { font-weight: 700; font-size: 0.9rem; border: none; background: transparent; width: 100%; }
        .lp-input-sub { font-size: 0.7rem; color: #666; border: none; background: transparent; width: 100%; }
        .lp-input-result { font-weight: 800; font-size: 1rem; border: none; background: transparent; width: 100%; }
        .lp-input-std { font-size: 0.85rem; border: none; background: transparent; width: 100%; }
        .lp-delete-btn { color: #ef4444; border: none; background: transparent; cursor: pointer; opacity: 0.2; }
        .lp-delete-btn:hover { opacity: 1; }
        .letter-footer { margin-top: auto; text-align: center; padding-bottom: 10px; }
        .footer-hours { font-size: 0.85rem; color: #1e40af; margin-bottom: 5px; }
        .footer-sunday { font-size: 0.85rem; color: #1e40af; margin-bottom: 10px; }
        .footer-promo { font-weight: 800; color: #1e40af; font-size: 0.95rem; }
        .table-controls { display: flex; gap: 15px; margin-top: 20px; }
        .lp-add-btn { background: #1e40af; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .lp-add-btn:hover { background: #1e3a8a; }
      ` }} />
    </div>
  );
};

export default EnterResults;
