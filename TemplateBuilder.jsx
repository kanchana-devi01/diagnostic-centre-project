import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import './dashboard.css';
import './forms.css';

const TemplateBuilder = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        templateName: '',
        category: '',
        parameters: []
    });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userData = JSON.parse(userStr);
            if (userData.role !== 'super_admin' && userData.role !== 'admin') {
                navigate('/dashboard');
            }
        } else {
            navigate('/login');
        }
        fetchTemplates();
    }, [navigate]);

    const fetchTemplates = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/catalog');
            setTemplates(res.data);
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    const handleCreateNew = () => {
        setSelectedTemplate(null);
        setFormData({
            templateName: '',
            category: '',
            parameters: [
                { name: '', method: '', unit: '', referenceRange: '' }
            ]
        });
        setIsEditing(true);
    };

    const handleEdit = (tmpl) => {
        setSelectedTemplate(tmpl.templateId || tmpl.id);
        setFormData({
            templateName: tmpl.templateName || tmpl.name || '',
            category: tmpl.category || '',
            parameters: tmpl.parameters && tmpl.parameters.length > 0 ? 
                [...tmpl.parameters] : 
                [{ name: '', method: '', unit: '', referenceRange: '' }]
        });
        setIsEditing(true);
    };

    const handleParamChange = (index, field, value) => {
        const newParams = [...formData.parameters];
        newParams[index][field] = value;
        setFormData({ ...formData, parameters: newParams });
    };

    const handleAddRow = () => {
        setFormData({
            ...formData,
            parameters: [...formData.parameters, { name: '', method: '', unit: '', referenceRange: '' }]
        });
    };

    const handleRemoveRow = (index) => {
        const newParams = formData.parameters.filter((_, i) => i !== index);
        setFormData({ ...formData, parameters: newParams });
    };

    const handleSave = async () => {
        if (!formData.templateName) {
            alert("Please provide a Template Name.");
            return;
        }
        
        try {
            const payload = { ...formData };
            if (selectedTemplate) {
                payload.templateId = selectedTemplate;
            }
            
            await axios.post('http://localhost:5000/api/catalog', payload);
            alert("Master Template saved successfully!");
            setIsEditing(false);
            fetchTemplates();
        } catch (error) {
            console.error("Error saving template:", error);
            alert("Failed to save template.");
        }
    };

    return (
        <div className="dashboard-page">
            <Navbar />
            <main className="gtake-main">
                <div className="gtake-welcome">
                    <div>
                        <h1 className="lab-title">Master Template Builder</h1>
                        <p>Create and manage reusable report templates</p>
                    </div>
                </div>

                {!isEditing ? (
                    <div className="lab-content-section">
                        <div className="section-header">
                            <h2>Existing Templates</h2>
                            <div className="section-actions">
                                <button className="action-btn success" onClick={handleCreateNew}>+ Create New Template</button>
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="lab-table">
                                <thead>
                                    <tr>
                                        <th>Template Name</th>
                                        <th>Category</th>
                                        <th>Parameters Count</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.map(tmpl => (
                                        <tr key={tmpl.templateId || tmpl.id}>
                                            <td className="font-medium">{tmpl.templateName || tmpl.name}</td>
                                            <td className="text-muted">{tmpl.category || '-'}</td>
                                            <td>{tmpl.parameters ? tmpl.parameters.length : 0}</td>
                                            <td className="actions-cell">
                                                <button className="action-btn" onClick={() => handleEdit(tmpl)}>
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {templates.length === 0 && (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No templates found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="lab-content-section">
                        <div className="section-header">
                            <h2>{selectedTemplate ? 'Edit Template' : 'New Template'}</h2>
                            <div className="section-actions" style={{ display: 'flex', gap: '10px' }}>
                                <button className="action-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button className="action-btn primary" onClick={handleSave}>Save Template</button>
                            </div>
                        </div>

                        <div className="form-container" style={{ maxWidth: '100%', margin: '0', padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                                <div className="form-group" style={{ flex: 2, margin: 0 }}>
                                    <label>Template / Test Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.templateName}
                                        onChange={(e) => setFormData({...formData, templateName: e.target.value})}
                                        placeholder="e.g. COMPLETE BLOOD COUNT (CBC)" 
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                    <label>Category</label>
                                    <input 
                                        type="text" 
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        placeholder="e.g. Hematology" 
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                            </div>

                            <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>Parameters</h3>
                            <table className="lab-table" style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                                <thead>
                                    <tr>
                                        <th>Parameter Name</th>
                                        <th>Method</th>
                                        <th>Unit</th>
                                        <th>Reference Range</th>
                                        <th style={{ width: '60px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.parameters.map((param, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <input 
                                                    type="text" 
                                                    value={param.name}
                                                    onChange={(e) => handleParamChange(idx, 'name', e.target.value)}
                                                    placeholder="e.g. Haemoglobin"
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                                />
                                            </td>
                                            <td>
                                                <input 
                                                    type="text" 
                                                    value={param.method}
                                                    onChange={(e) => handleParamChange(idx, 'method', e.target.value)}
                                                    placeholder="e.g. WB/Automated"
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                                />
                                            </td>
                                            <td>
                                                <input 
                                                    type="text" 
                                                    value={param.unit}
                                                    onChange={(e) => handleParamChange(idx, 'unit', e.target.value)}
                                                    placeholder="e.g. g/dL"
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                                />
                                            </td>
                                            <td>
                                                <input 
                                                    type="text" 
                                                    value={param.referenceRange}
                                                    onChange={(e) => handleParamChange(idx, 'referenceRange', e.target.value)}
                                                    placeholder="e.g. 11.0 - 14.0"
                                                    style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                                />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => handleRemoveRow(idx)}
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '5px' }}
                                                    title="Remove Row"
                                                >&times;</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button 
                                onClick={handleAddRow}
                                style={{ marginTop: '15px', background: 'transparent', border: '1px dashed #cbd5e1', padding: '10px', borderRadius: '6px', color: '#64748b', cursor: 'pointer', width: '100%', fontWeight: '500' }}
                            >
                                + Add Row
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TemplateBuilder;
