import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from './Navbar';
import './dashboard.css';

const CreateTemplate = () => {
    const [image, setImage] = useState(null);
    const [reportName, setReportName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Editable template state
    const [templateSections, setTemplateSections] = useState([]);
    
    const handleImageUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const processOCR = async () => {
        if (!image) return alert("Please upload an image first.");
        if (!reportName) return alert("Please provide a report name.");
        
        setIsProcessing(true);
        try {
            const result = await Tesseract.recognize(image, 'eng', {
                logger: m => console.log(m)
            });
            
            const text = result.data.text;
            
            // Basic heuristic parsing: split lines and try to guess tests
            const lines = text.split('\n').filter(l => l.trim() !== '');
            const parsedTests = [];
            
            lines.forEach(line => {
                // Ignore headers/footers loosely
                if (line.length > 5 && !line.toLowerCase().includes('report') && !line.toLowerCase().includes('name')) {
                    parsedTests.push({
                        testName: line.substring(0, 30).trim(), // Guess test name from first few words
                        units: "",
                        referenceRange: ""
                    });
                }
            });

            // Set as one default section for the editable preview
            setTemplateSections([{
                sectionName: "EXTRACTED SECTION",
                tests: parsedTests.slice(0, 10) // Limit to avoid massive tables
            }]);
            
        } catch (error) {
            console.error("OCR Error:", error);
            alert("Failed to process image with Tesseract.js.");
        }
        setIsProcessing(false);
    };

    const handleSectionChange = (sIdx, field, value) => {
        const updated = [...templateSections];
        updated[sIdx][field] = value;
        setTemplateSections(updated);
    };

    const handleTestChange = (sIdx, tIdx, field, value) => {
        const updated = [...templateSections];
        updated[sIdx].tests[tIdx][field] = value;
        setTemplateSections(updated);
    };

    const handleAddTest = (sIdx) => {
        const updated = [...templateSections];
        updated[sIdx].tests.push({ testName: "", units: "", referenceRange: "" });
        setTemplateSections(updated);
    };

    const handleRemoveTest = (sIdx, tIdx) => {
        const updated = [...templateSections];
        updated[sIdx].tests.splice(tIdx, 1);
        setTemplateSections(updated);
    };

    const saveTemplate = async () => {
        try {
            await addDoc(collection(db, 'templates'), {
                reportName,
                sections: templateSections,
                createdAt: serverTimestamp()
            });
            alert("Template saved to Firebase successfully!");
            setTemplateSections([]);
            setReportName('');
            setImage(null);
        } catch (error) {
            console.error("Firebase Error:", error);
            alert("Error saving template to Firebase. Did you add your config in firebase.js?");
        }
    };

    return (
        <div className="dashboard-page">
            <Navbar />
            <main className="gtake-main" style={{ padding: '30px' }}>
                <h1 className="lab-title">Create Template via OCR</h1>
                <p style={{ color: '#64748b', marginBottom: '20px' }}>Upload a lab report image to automatically extract tests using Tesseract.js (Client-Side, Free)</p>

                <div className="lab-content-section">
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <input 
                            type="text" 
                            placeholder="Template Name (e.g., Lipid Profile)" 
                            value={reportName}
                            onChange={(e) => setReportName(e.target.value)}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: 1 }}
                        />
                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                        <button 
                            className="primary-btn" 
                            onClick={processOCR} 
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing OCR...' : 'Extract with Tesseract'}
                        </button>
                    </div>

                    {templateSections.length > 0 && (
                        <div style={{ marginTop: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h2>Editable Template Preview</h2>
                                <button className="action-btn success" style={{ padding: '8px 16px' }} onClick={saveTemplate}>
                                    Lock & Save Template
                                </button>
                            </div>
                            <p style={{ color: '#64748b', marginBottom: '20px' }}>
                                Fix any OCR mistakes before saving to Firebase. Result columns will be added dynamically when assigning.
                            </p>

                            {templateSections.map((section, sIdx) => (
                                <div key={sIdx} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                    <input 
                                        type="text" 
                                        value={section.sectionName}
                                        onChange={(e) => handleSectionChange(sIdx, 'sectionName', e.target.value)}
                                        style={{ fontSize: '1.1rem', fontWeight: 'bold', padding: '8px', marginBottom: '15px', width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                    />
                                    
                                    <table className="lab-table">
                                        <thead>
                                            <tr>
                                                <th>Test Name</th>
                                                <th>Units</th>
                                                <th>Reference Range</th>
                                                <th style={{ width: '50px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.tests.map((test, tIdx) => (
                                                <tr key={tIdx}>
                                                    <td>
                                                        <input 
                                                            type="text" 
                                                            value={test.testName} 
                                                            onChange={(e) => handleTestChange(sIdx, tIdx, 'testName', e.target.value)}
                                                            style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input 
                                                            type="text" 
                                                            value={test.units} 
                                                            onChange={(e) => handleTestChange(sIdx, tIdx, 'units', e.target.value)}
                                                            style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input 
                                                            type="text" 
                                                            value={test.referenceRange} 
                                                            onChange={(e) => handleTestChange(sIdx, tIdx, 'referenceRange', e.target.value)}
                                                            style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                                        />
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button 
                                                            onClick={() => handleRemoveTest(sIdx, tIdx)}
                                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                                                        >
                                                            &times;
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    <button 
                                        onClick={() => handleAddTest(sIdx)}
                                        style={{ marginTop: '15px', background: 'transparent', border: '1px dashed #cbd5e1', padding: '8px 16px', borderRadius: '6px', color: '#64748b', cursor: 'pointer', width: '100%' }}
                                    >
                                        + Add Test Row
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CreateTemplate;
