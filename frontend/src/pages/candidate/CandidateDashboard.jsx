import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import candidateService from '../../services/candidateService';
import './CandidateDashboard.css';

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileData = await candidateService.getMyProfile();
        const appsData = await candidateService.getMyApplications();
        setProfile(profileData);
        setApplications(appsData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-root" style={{justifyContent: 'center', alignItems: 'center'}}>
        <div className="auth-spinner" style={{width: '40px', height: '40px', borderTopColor: 'var(--c-gold)'}}></div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Applications', value: applications.length, icon: '📝', trend: 'Active tracking' },
    { label: 'Shortlisted', value: applications.filter(a => a.status === 'SHORTLISTED').length, icon: '⭐', trend: 'Keep it up!' },
    { label: 'Experience', value: `${profile?.experienceYears || 0} yrs`, icon: '⏳', trend: 'In your field' },
    { label: 'Profile Status', value: profile?.isAvailable ? 'Available' : 'Busy', icon: '👤', trend: 'Visibility' },
  ];

  return (
    <div className="dashboard-root">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <span className="brand-icon">⬡</span>
            <span className="brand-text">IntelliRecruit</span>
          </Link>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/candidate/dashboard" className="nav-item nav-item--active">
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          <Link to="/candidate/profile" className="nav-item">
            <span className="nav-icon">👤</span>
            My Profile
          </Link>
          <Link to="/candidate/applications" className="nav-item">
            <span className="nav-icon">📁</span>
            Applications
          </Link>
          <Link to="/candidate/vacancies" className="nav-item">
            <span className="nav-icon">🔍</span>
            Browse Jobs
          </Link>
          <Link to="/candidate/contracts" className="nav-item">
            <span className="nav-icon">📄</span>
            My Contracts
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <span className="nav-icon">⏻</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="main-area">
        <header className="top-header">
          <div className="page-title">
            <h1>Dashboard</h1>
          </div>
          
          <div className="user-profile-brief">
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">Candidate</span>
            </div>
            <div className="user-avatar">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'C'}
            </div>
          </div>
        </header>

        <div className="content-body">
          {/* ── Welcome Section ── */}
          <div className="welcome-banner">
             <div className="section-eyebrow" style={{color: 'var(--c-gold)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px'}}>Personal Overview</div>
             <h2 style={{fontFamily: 'var(--font-display)', fontSize: '32px', marginBottom: '32px'}}>Welcome back, <em>{user?.name?.split(' ')[0]}</em>.</h2>
          </div>

          {/* ── Stats Grid ── */}
          <div className="stats-grid">
            {stats.map((s, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-trend trend-up">{s.trend}</div>
                </div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Main Grid ── */}
          <div className="dashboard-sections">
            {/* Left Col: Recent Applications */}
            <section className="section-card">
              <div className="section-title-row">
                <h2>Recent Applications</h2>
                <button className="btn-text" onClick={() => navigate('/candidate/applications')}>View All</button>
              </div>
              
              <div className="application-list">
                {applications.length > 0 ? (
                  applications.slice(0, 3).map(app => (
                    <div key={app.id} className="application-item">
                      <div className="company-logo">{app.vacancy?.employer?.companyName?.[0] || 'J'}</div>
                      <div className="job-info">
                        <h4>{app.vacancy?.title}</h4>
                        <p>{app.vacancy?.employer?.companyName} • {new Date(app.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <div className={`status-badge status-${app.status.toLowerCase()}`}>
                        {app.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{textAlign: 'center', padding: '40px 0', color: 'var(--c-text-muted)'}}>
                    No applications yet. Start exploring jobs!
                  </div>
                )}
              </div>
            </section>

            {/* Right Col: Profile Completion & AI Insights */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
              <section className="section-card">
                <div className="section-title-row">
                  <h2>Profile Score</h2>
                </div>
                <div className="profile-completion">
                  <div className="completion-header">
                    <span>AI Strength Match</span>
                    <span>{profile?.bio ? 85 : 40}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${profile?.bio ? 85 : 40}%`}}></div>
                  </div>
                  <div className="profile-tips">
                    <div className="tip-item">
                      <span className="tip-check" style={{color: profile?.bio ? 'var(--c-gold)' : 'var(--c-text-dim)'}}>{profile?.bio ? '✓' : '○'}</span>
                      <span>Professional bio generated</span>
                    </div>
                    <div className="tip-item">
                      <span className="tip-check" style={{color: profile?.resumeUrl ? 'var(--c-gold)' : 'var(--c-text-dim)'}}>{profile?.resumeUrl ? '✓' : '○'}</span>
                      <span>Resume uploaded</span>
                    </div>
                    <div className="tip-item">
                      <span className="tip-check" style={{color: profile?.skills ? 'var(--c-gold)' : 'var(--c-text-dim)'}}>{profile?.skills ? '✓' : '○'}</span>
                      <span>Skills added</span>
                    </div>
                  </div>
                  <button className="btn-profile-complete" onClick={() => navigate('/candidate/profile')}>
                    {profile?.bio ? 'Update Profile' : 'Complete My Profile'}
                  </button>
                </div>
              </section>

              <section className="section-card" style={{background: 'linear-gradient(145deg, var(--c-surface), var(--c-gold-dim))', borderColor: 'rgba(201,168,76,0.3)'}}>
                 <h3 style={{fontFamily: 'var(--font-display)', fontSize: '18px', marginBottom: '12px', color: 'var(--c-gold)'}}>AI Job Matching</h3>
                 <p style={{fontSize: '13px', color: 'var(--c-text-muted)', lineHeight: '1.6', marginBottom: '16px'}}>
                   Our Gemini AI analyzes your skills ({profile?.skills || 'Not added yet'}) to find the best opportunities for you.
                 </p>
                 <button className="btn-text" style={{padding: '0'}} onClick={() => navigate('/candidate/vacancies')}>Explore Matches →</button>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateDashboard;
