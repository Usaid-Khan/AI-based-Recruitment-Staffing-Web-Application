import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import candidateService from '../../services/candidateService';
import './MyApplications.css';

const STATUS_FILTERS = ['ALL', 'APPLIED', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'REJECTED'];

const MyApplications = () => {
  const navigate = useNavigate();
  const [user] = useState(authService.getCurrentUser());
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (activeFilter === 'ALL') {
      setFilteredApps(applications);
    } else {
      setFilteredApps(applications.filter(app => app.status === activeFilter));
    }
  }, [activeFilter, applications]);

  const fetchApplications = async () => {
    try {
      const data = await candidateService.getMyApplications();
      setApplications(data);
      setFilteredApps(data);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="apps-root" style={{justifyContent: 'center', alignItems: 'center'}}>
        <div className="auth-spinner" style={{width: '40px', height: '40px', borderTopColor: 'var(--c-gold)'}}></div>
      </div>
    );
  }

  return (
    <div className="apps-root">
      {/* ── Sidebar ── */}
      <aside className="sidebar" style={{width: '280px', backgroundColor: 'var(--c-surface)', borderRight: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 100}}>
        <div className="sidebar-header" style={{padding: '32px 24px'}}>
          <Link to="/" className="sidebar-brand" style={{display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none'}}>
            <span className="brand-icon" style={{fontSize: '24px', color: 'var(--c-gold)'}}>⬡</span>
            <span className="brand-text" style={{fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px'}}>IntelliRecruit</span>
          </Link>
        </div>
        
        <nav className="sidebar-nav" style={{flex: 1, padding: '0 16px'}}>
          <Link to="/candidate/dashboard" className="nav-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'var(--transition)', marginBottom: '4px'}}>
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          <Link to="/candidate/profile" className="nav-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'var(--transition)', marginBottom: '4px'}}>
            <span className="nav-icon">👤</span>
            My Profile
          </Link>
          <Link to="/candidate/applications" className="nav-item nav-item--active" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-gold)', backgroundColor: 'var(--c-gold-dim)', textDecoration: 'none', fontWeight: '600', marginBottom: '4px'}}>
            <span className="nav-icon">📁</span>
            Applications
          </Link>
          <Link to="/candidate/vacancies" className="nav-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'var(--transition)', marginBottom: '4px'}}>
            <span className="nav-icon">🔍</span>
            Browse Jobs
          </Link>
          <Link to="/candidate/contracts" className="nav-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'var(--transition)', marginBottom: '4px'}}>
            <span className="nav-icon">📄</span>
            My Contracts
          </Link>
        </nav>

        <div className="sidebar-footer" style={{padding: '24px', borderTop: '1px solid var(--c-border)'}}>
          <button className="btn-logout" onClick={handleLogout} style={{width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#f87171', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', cursor: 'pointer', transition: 'var(--transition)', fontWeight: '600'}}>
            <span className="nav-icon">⏻</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-area">
        <header className="apps-header">
          <h1>My Applications</h1>
          <p>Track the status of your journey with top companies.</p>
        </header>

        <div className="apps-filters">
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter}
              className={`filter-btn ${activeFilter === filter ? 'filter-btn--active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="apps-container">
          {filteredApps.length > 0 ? (
            <table className="apps-table">
              <thead>
                <tr>
                  <th>Position & Company</th>
                  <th>Date Applied</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div className="job-cell">
                        <div className="company-initial">{app.companyName?.[0] || 'J'}</div>
                        <div>
                          <span className="job-title">{app.vacancyTitle}</span>
                          <span className="company-name">{app.companyName}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">{formatDate(app.appliedAt)}</div>
                    </td>
                    <td>
                      <span className={`status-badge status-${app.status.toLowerCase()}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn" onClick={() => navigate(`/vacancies/${app.vacancyId}`)}>
                        View Job
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No applications found</h3>
              <p>You haven't applied to any jobs matching this criteria yet.</p>
              <Link to="/candidate/vacancies" className="btn-primary">
                Browse Open Vacancies
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyApplications;
