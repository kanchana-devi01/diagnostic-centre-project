import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

    return (
        <nav className="top-navbar">
            <div className="nav-brand" onClick={() => navigate('/dashboard')}>
                <img src="/logo.png" alt="Sairam" className="nav-logo" />
                <span className="nav-title">SAIRAM DIAGNOSTIC CENTRE</span>
            </div>

            <div className="nav-links">
                <span className={isActive('/')} onClick={() => navigate('/')}>Home</span>
                
                {user?.name && (
                    <span 
                      className={isActive(user?.role === 'super_admin' ? '/superadmin' : '/dashboard')} 
                      onClick={() => navigate(user?.role === 'super_admin' ? '/superadmin' : '/dashboard')}
                    >
                      Dashboard
                    </span>
                )}

                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <span className={isActive('/add-patient')} onClick={() => navigate('/add-patient')}>Add Patient</span>
                )}

                {user?.role === 'super_admin' && (
                    <>
                        <span className={isActive('/enter-results')} onClick={() => navigate('/enter-results')}>Enter Results</span>
                        <span className={isActive('/add-admin')} onClick={() => navigate('/add-admin')}>Manage Admins</span>
                    </>
                )}

                <div className="nav-right-actions">
                    <span className="nav-link nav-user">
                        👤 {user?.name || 'User'}
                    </span>
                    <Link to="/patient-login" className="pink-report-nav-btn">Report</Link>
                    <span className="nav-link nav-logout" onClick={handleLogout} style={{marginLeft: '15px'}}>Logout</span>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
