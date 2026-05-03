import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import candidateService from '../../services/candidateService';
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  Search, 
  Briefcase, 
  LogOut,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Upload,
  ArrowRight,
  TrendingUp,
  FileDown
} from 'lucide-react';
import './CandidateProfile.css';

const CandidateProfile = () => {
  const navigate = useNavigate();
  const [user] = useState(authService.getCurrentUser());
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    bio: '',
    skills: '',
    experienceYears: 0,
    isAvailable: true
  });
  
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await candidateService.getMyProfile();
      setProfile(data);
      setFormData({
        bio: data.bio || '',
        skills: data.skills || '',
        experienceYears: data.experienceYears || 0,
        isAvailable: data.isAvailable ?? true
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setMessage({ text: 'Failed to load profile details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillAdd = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const currentSkills = formData.skills ? formData.skills.split(',').map(s => s.trim()) : [];
      if (!currentSkills.includes(skillInput.trim())) {
        const newSkills = [...currentSkills, skillInput.trim()].join(', ');
        setFormData(prev => ({ ...prev, skills: newSkills }));
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    const newSkills = formData.skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== skillToRemove)
      .join(', ');
    setFormData(prev => ({ ...prev, skills: newSkills }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      await candidateService.updateProfile(profile.id, formData);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      fetchProfile();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSaving(true);
    setMessage({ text: 'Uploading resume...', type: 'info' });

    try {
      await candidateService.uploadResume(profile.id, file);
      setMessage({ text: 'Resume uploaded successfully!', type: 'success' });
      fetchProfile();
    } catch (err) {
      setMessage({ text: 'Failed to upload resume.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="profile-root" style={{justifyContent: 'center', alignItems: 'center'}}>
        <div className="auth-spinner" style={{width: '40px', height: '40px', borderTopColor: 'var(--c-gold)'}}></div>
      </div>
    );
  }

  const skillsList = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s !== "") : [];

  return (
    <div className="profile-root">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <span className="brand-icon">⬡</span>
            <span className="brand-text">IntelliRecruit</span>
          </Link>
        </div>
        
        <nav className="sidebar-nav" style={{flex: 1, padding: '0 16px'}}>
          <Link to="/candidate/dashboard" className="nav-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'var(--transition)', marginBottom: '4px'}}>
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/candidate/profile" className="nav-item nav-item--active" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-gold)', backgroundColor: 'var(--c-gold-dim)', textDecoration: 'none', fontWeight: '600', marginBottom: '4px'}}>
            <User size={20} />
            My Profile
          </Link>
          <Link to="/candidate/applications" className="nav-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'var(--transition)', marginBottom: '4px'}}>
            <FileText size={20} />
            Applications
          </Link>
          <Link to="/candidate/vacancies" className="nav-item" style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: 'var(--c-text-muted)', textDecoration: 'none', transition: 'var(--transition)', marginBottom: '4px'}}>
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
        <div className="profile-header-card">
          <div className="profile-avatar-large">
            {user?.name?.split(' ').map(n => n[0]).join('') || 'C'}
          </div>
          <div className="profile-identity">
            <h1>{user?.name}</h1>
            <p>{user?.email} • {formData.experienceYears} Years Experience</p>
          </div>
        </div>

        {message.text && (
          <div className={`auth-error ${message.type === 'success' ? 'auth-success' : ''}`} style={{marginBottom: '24px', backgroundColor: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderColor: message.type === 'success' ? '#22c55e' : '#ef4444', color: message.type === 'success' ? '#22c55e' : '#ef4444'}}>
            <span className="auth-error-icon">
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            </span>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-grid">
          {/* Left Column: Main Info */}
          <div className="profile-main-col">
            <section className="profile-section">
              <div className="section-title">
                <FileText size={18} /> Professional Bio
              </div>
              <div className="form-group">
                <label>Tell employers about yourself</label>
                <textarea 
                  name="bio"
                  className="form-textarea"
                  placeholder="e.g. Senior Frontend Developer with a passion for AI-driven interfaces..."
                  value={formData.bio}
                  onChange={handleInputChange}
                />
              </div>
            </section>

            <section className="profile-section">
              <div className="section-title">
                <Briefcase size={18} /> Skills & Expertise
              </div>
              <div className="form-group">
                <label>Add skills (Press Enter)</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. React, Spring Boot, Figma..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillAdd}
                />
              </div>
              <div className="skills-tags">
                {skillsList.map((skill, idx) => (
                  <div key={idx} className="skill-tag">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>×</button>
                  </div>
                ))}
                {skillsList.length === 0 && <p style={{color: 'var(--c-text-dim)', fontSize: '13px'}}>No skills added yet.</p>}
              </div>
            </section>

            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
              {!saving && <ArrowRight size={18} style={{marginLeft: '8px'}} />}
            </button>
          </div>

          {/* Right Column: Sidebar Stats/Settings */}
          <div className="profile-side-col">
            <section className="profile-section">
              <div className="section-title">
                <Sparkles size={18} /> Visibility
              </div>
              <div className="availability-toggle">
                <div className="status-indicator">
                  <div className={`status-dot ${formData.isAvailable ? 'status-dot--active' : 'status-dot--inactive'}`} />
                  {formData.isAvailable ? 'Open to Work' : 'Currently Busy'}
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className={`bio-status ${profile?.bio ? 'bio-status--active' : ''}`} style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '12px'}}>
                {profile?.bio ? (
                  <><CheckCircle size={14} color="var(--c-gold)" /> AI Bio Active</>
                ) : (
                  <><AlertCircle size={14} /> Bio Not Generated</>
                )}
              </div>
            </section>

            <section className="profile-section">
              <div className="section-title">
                <TrendingUp size={18} /> Experience
              </div>
              <div className="form-group">
                <label>Years of Experience</label>
                <input 
                  type="number"
                  name="experienceYears"
                  className="form-input"
                  min="0"
                  max="50"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                />
              </div>
            </section>

            <section className="profile-section">
              <div className="section-title">
                <FileText size={18} /> Resume / CV
              </div>
              {profile?.resumeUrl && (
                <div style={{marginBottom: '16px'}}>
                  <div className="skill-tag" style={{width: '100%', justifyContent: 'space-between', borderRadius: '8px', padding: '10px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <FileDown size={14} color="var(--c-gold)" />
                      <span style={{fontSize: '12px'}}>Resume Uploaded</span>
                    </div>
                    <a href={profile.resumeUrl} target="_blank" rel="noreferrer" style={{color: 'var(--c-gold)', fontSize: '12px', fontWeight: '600', textDecoration: 'none'}}>View</a>
                  </div>
                </div>
              )}
              <div className="resume-box">
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                <div className="resume-icon">
                  <Upload size={24} />
                </div>
                <div className="resume-info">
                  <h4>{profile?.resumeUrl ? 'Update Resume' : 'Upload Resume'}</h4>
                  <p>PDF or Word (Max 5MB)</p>
                </div>
              </div>
            </section>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CandidateProfile;
