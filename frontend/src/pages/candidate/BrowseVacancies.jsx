import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import authService from '../../services/authService';
import vacancyService from '../../services/vacancyService';
import candidateService from '../../services/candidateService';
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  Search, 
  Briefcase, 
  LogOut,
  Building,
  DollarSign,
  MapPin,
  X
} from 'lucide-react';
import './BrowseVacancies.css';

const BrowseVacancies = () => {
  const navigate = useNavigate();
  const [user] = useState(authService.getCurrentUser());
  const [vacancies, setVacancies] = useState([]);
  const [myAppIds, setMyAppIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vData, aData] = await Promise.all([
        vacancyService.getOpenVacancies(),
        candidateService.getMyApplications()
      ]);
      setVacancies(vData);
      setMyAppIds(new Set(aData.map(app => app.vacancyId)));
    } catch (err) {
      console.error("Error loading vacancies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadData();
      return;
    }
    setLoading(true);
    try {
      const data = await vacancyService.searchVacancies(searchQuery);
      setVacancies(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (vId) => {
    setApplying(true);
    setMessage({ text: '', type: '' });
    try {
      await vacancyService.applyForVacancy(vId);
      setMessage({ text: 'Application submitted successfully!', type: 'success' });
      setMyAppIds(prev => new Set([...prev, vId]));
      if (selectedVacancy) setSelectedVacancy(null);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to submit application.', type: 'error' });
    } finally {
      setApplying(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading && vacancies.length === 0) {
    return (
      <div className="browse-root" style={{justifyContent: 'center', alignItems: 'center'}}>
        <div className="auth-spinner" style={{width: '40px', height: '40px', borderTopColor: 'var(--c-gold)'}}></div>
      </div>
    );
  }

  return (
    <div className="browse-root">
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
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/candidate/profile" className="nav-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'var(--transition)', marginBottom: '4px'}}>
            <User size={20} />
            My Profile
          </Link>
          <Link to="/candidate/applications" className="nav-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'var(--transition)', marginBottom: '4px'}}>
            <FileText size={20} />
            Applications
          </Link>
          <Link to="/candidate/vacancies" className="nav-item nav-item--active" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-gold)', backgroundColor: 'var(--c-gold-dim)', textDecoration: 'none', fontWeight: '600', marginBottom: '4px'}}>
            <Search size={20} />
            Browse Jobs
          </Link>
          <Link to="/candidate/contracts" className="nav-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'var(--transition)', marginBottom: '4px'}}>
            <Briefcase size={20} />
            My Contracts
          </Link>
        </nav>

        <div className="sidebar-footer" style={{padding: '24px', borderTop: '1px solid var(--c-border)'}}>
          <button className="btn-logout" onClick={handleLogout} style={{width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#f87171', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', cursor: 'pointer', transition: 'var(--transition)', fontWeight: '600'}}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-area">
        <header className="browse-header">
          <div>
            <h1>Discover Opportunities</h1>
            <p>Your next executive role is just one click away.</p>
          </div>
        </header>

        <form className="search-container" onSubmit={handleSearch}>
          <div className="search-input-wrap">
            <Search size={20} className="search-input-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by role, company, or skills..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-search">Search</button>
        </form>

        {message.text && (
          <div className={`auth-error ${message.type === 'success' ? 'auth-success' : ''}`} style={{marginBottom: '32px', padding: '16px', borderRadius: '12px', backgroundColor: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`, color: message.type === 'success' ? '#22c55e' : '#ef4444'}}>
            {message.text}
          </div>
        )}

        <div className="vacancy-grid">
          {vacancies.map(vacancy => (
            <div key={vacancy.id} className="vacancy-card">
              <div className="card-top">
                <div className="company-logo">{vacancy.companyName?.[0] || 'V'}</div>
                <div className="salary-tag">{vacancy.salaryRange || 'Competitive'}</div>
              </div>
              <h3 className="vacancy-title">{vacancy.title}</h3>
              <div className="vacancy-company">
                <Building size={14} /> {vacancy.companyName}
              </div>
              <div className="vacancy-description">
                <ReactMarkdown>{vacancy.description}</ReactMarkdown>
              </div>
              <div className="vacancy-requirements">
                {vacancy.requirements?.split(',').slice(0, 3).map((req, i) => (
                  <span key={i} className="req-tag">{req.trim()}</span>
                ))}
              </div>
              <div className="card-footer">
                <button 
                  className="btn-apply" 
                  disabled={myAppIds.has(vacancy.id) || applying}
                  onClick={() => handleApply(vacancy.id)}
                >
                  {myAppIds.has(vacancy.id) ? 'Applied' : 'Apply Now'}
                </button>
                <button className="btn-view" onClick={() => setSelectedVacancy(vacancy)}>
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {vacancies.length === 0 && !loading && (
          <div className="empty-state" style={{padding: '100px 40px', textAlign: 'center'}}>
            <div style={{fontSize: '64px', marginBottom: '24px', opacity: 0.2}}>🔍</div>
            <h3 style={{fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '12px'}}>No vacancies found</h3>
            <p style={{color: 'var(--c-text-muted)'}}>Try adjusting your search keywords to find more roles.</p>
          </div>
        )}
      </main>

      {/* ── Vacancy Details Modal ── */}
      {selectedVacancy && (
        <div className="modal-overlay" onClick={() => setSelectedVacancy(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVacancy(null)}><X size={24} /></button>
            
            <div className="modal-header">
              <div className="modal-company">{selectedVacancy.companyName}</div>
              <h2 className="modal-title">{selectedVacancy.title}</h2>
              <div className="modal-meta">
                <div className="meta-item"><DollarSign size={16} color="var(--c-gold)" /> {selectedVacancy.salaryRange || 'Competitive Salary'}</div>
                <div className="meta-item"><MapPin size={16} color="var(--c-gold)" /> Remote / On-site</div>
              </div>
            </div>

            <div className="modal-section">
              <h4 className="modal-section-title">Job Description</h4>
              <div className="modal-body markdown-content">
                <ReactMarkdown>{selectedVacancy.description}</ReactMarkdown>
              </div>
            </div>

            <div className="modal-section">
              <h4 className="modal-section-title">Requirements</h4>
              <div className="modal-body markdown-content">
                <ReactMarkdown>{selectedVacancy.requirements}</ReactMarkdown>
              </div>
            </div>

            <div className="card-footer" style={{marginTop: '40px'}}>
              <button 
                className="btn-apply" 
                style={{padding: '16px'}}
                disabled={myAppIds.has(selectedVacancy.id) || applying}
                onClick={() => handleApply(selectedVacancy.id)}
              >
                {myAppIds.has(selectedVacancy.id) ? 'Applied' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseVacancies;
