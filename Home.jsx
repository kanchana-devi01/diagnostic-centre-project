import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './home.css';

const Home = () => {
    const navigate = useNavigate();

    const facilities = [
        { name: 'PET/CT Scan', icon: '📡' },
        { name: 'Genetics', icon: '🧬' },
        { name: 'X-ray', icon: '🩻' },
        { name: 'Mammogram', icon: '🎀' },
        { name: 'CT - Scan', icon: '💿' },
        { name: 'MRI', icon: '🧲' },
        { name: 'Pathology', icon: '🔬' },
        { name: 'Laboratory', icon: '🧪' },
        { name: 'Health Check', icon: '🩺' },
        { name: 'DEXA Scan', icon: '🦴' },
        { name: 'Ultrasound', icon: '🔊' },
        { name: 'Nuclear Medicine', icon: '☢️' }
    ];

    const specialisations = [
        { name: 'Onco Diagnostics', icon: '🔍' },
        { name: 'Clinical Genetics', icon: '🧬' },
        { name: 'Infectious Disease', icon: '🦠' },
        { name: 'Neuro Genetics', icon: '🧠' },
        { name: 'New Born Screening', icon: '👶' },
        { name: 'Prenatal Genetic Screening', icon: '🤰' }
    ];

    return (
        <div className="home-container">
            {/* Navbar */}
            <nav className="home-navbar">
                <div className="home-logo">
                    <img src="/logo.png" alt="Sairam Logo" className="logo-img" />
                    <span className="logo-text">SAIRAM DIAGNOSTIC</span>
                </div>
                <div className="nav-links">
                    <Link to="/patient-login" className="nav-report-btn">View Reports</Link>
                    <button onClick={() => navigate('/signup')} className="nav-signup-btn">Signup</button>
                    <button onClick={() => navigate('/login')} className="nav-login-btn">Login</button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="home-hero">
                <div className="hero-content">
                    <h1>Sairam Diagnostic Centre</h1>
                    <p>Providing precision diagnostics with state-of-the-art technology and compassionate care.</p>
                    <button className="cta-btn">Book an Appointment</button>
                </div>
                <div className="hero-illustration">
                    <img src="/logo.png" alt="Sairam Diagnostic Logo" className="logo-img-large pop-effect" />
                </div>
            </section>

            {/* Diagnostic Facilities */}
            <section className="home-section facilities-section">
                <h2 className="section-title">Our Diagnostic Facilities</h2>
                <div className="facilities-grid">
                    {facilities.map((f, i) => (
                        <div key={i} className="facility-card">
                            <div className="facility-icon">{f.icon}</div>
                            <span className="facility-name">{f.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Specialisations */}
            <section className="home-section special-section">
                <div className="special-content-wrapper">
                    <div className="special-illustration">
                        <div className="test-tubes-graphic">
                            <div className="tube blue"></div>
                            <div className="tube orange"></div>
                            <div className="tube dark-blue"></div>
                            <div className="magnifier">🔍</div>
                        </div>
                    </div>
                    <div className="special-list-area">
                        <h2 className="section-title left">Our Specialisations</h2>
                        <div className="specialisations-grid">
                            {specialisations.map((s, i) => (
                                <div key={i} className="special-card">
                                    <div className="special-icon-box">{s.icon}</div>
                                    <span className="special-name">{s.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Home Testing Section */}
            <section className="home-section home-testing">
                <div className="testing-content-wrapper">
                    <div className="testing-text">
                        <h3>Stay Stress-Free</h3>
                        <h2>Get Yourself Tested at Home</h2>
                        <p className="sub-tag">At - Home Tests</p>
                        <p className="testing-desc">
                            The importance of diagnostic tests cannot be overstated, but commuting to a diagnostic centre is not easy for everyone. 
                            That's why Sairam Diagnostic offers comprehensive sample collection services right to your doorstep.
                        </p>
                        <button className="know-more-btn">Know More</button>
                    </div>
                    <div className="testing-illustration">
                        <div className="scooter-graphic">
                            <div className="scooter">🛵</div>
                            <div className="house">🏠</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Placeholder (already exists in App.jsx but styled here for home) */}
            <footer className="home-footer">
                <p>&copy; 2024 Sairam Diagnostic Centre. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;
