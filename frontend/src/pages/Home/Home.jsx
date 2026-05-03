import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

/* ─── tiny hook: count up numbers ─── */
function useCountUp(target, duration = 2000, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return val;
}

/* ─── Stat item ─── */
function StatItem({ value, suffix, label, start }) {
  const count = useCountUp(value, 2200, start);
  return (
    <div className="stat-item">
      <span className="stat-number">
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: "✦",
      title: "AI Candidate Matching",
      desc: "Gemini-powered ranking instantly scores every applicant against your vacancy requirements.",
      tag: "Core AI",
    },
    {
      icon: "◈",
      title: "Smart Bio Generator",
      desc: "One click produces a polished, professional candidate biography — ready to share.",
      tag: "Productivity",
    },
    {
      icon: "◉",
      title: "Contract Automation",
      desc: "Generate legally-structured employment contracts in seconds from placement data.",
      tag: "Legal AI",
    },
    {
      icon: "⬡",
      title: "Vacancy Intelligence",
      desc: "AI writes, rewrites, and compliance-filters every job posting before it goes live.",
      tag: "Quality",
    },
    {
      icon: "◎",
      title: "Order Management",
      desc: "Employers place staffing orders and shortlist candidates through a guided workflow.",
      tag: "Workflow",
    },
    {
      icon: "✧",
      title: "Email & Blog AI",
      desc: "Craft recruitment emails and publish thought-leadership content without a copywriter.",
      tag: "Content",
    },
  ];

  const steps = [
    { num: "01", title: "Register & Profile", desc: "Candidates build profiles; employers set up their company in minutes." },
    { num: "02", title: "Post or Apply", desc: "Employers post AI-enhanced vacancies. Candidates apply with a single click." },
    { num: "03", title: "AI Recommends", desc: "Gemini ranks candidates against every vacancy with match scores and reasoning." },
    { num: "04", title: "Place & Contract", desc: "Confirm placements and auto-generate signed contracts — all inside the platform." },
  ];

  const testimonials = [
    { name: "Sarah Mitchell", role: "Head of Talent, NovaCorp", quote: "IntelliRecruit cut our time-to-hire by 60%. The AI recommendations are eerily accurate.", avatar: "SM" },
    { name: "David Osei", role: "Recruitment Director, Apexia", quote: "The contract generator alone saved us thousands in legal fees. Absolute game-changer.", avatar: "DO" },
    { name: "Priya Sharma", role: "HR Manager, Stratum Group", quote: "Our candidates love how professional their AI-generated bios look. Placements are up 40%.", avatar: "PS" },
  ];

  return (
    <div className="home-root">

      {/* ── Navbar ── */}
      <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        <div className="navbar-inner">
          <a href="/" className="brand">
            <span className="brand-icon">⬡</span>
            <span className="brand-text">IntelliRecruit</span>
          </a>

          <ul className={`nav-links ${menuOpen ? "nav-links--open" : ""}`}>
            <li><a href="#features" onClick={() => setMenuOpen(false)}>Features</a></li>
            <li><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a></li>
            <li><a href="#testimonials" onClick={() => setMenuOpen(false)}>Testimonials</a></li>
          </ul>

          <div className="nav-actions">
            <button className="btn-ghost" onClick={() => navigate("/login")}>
              Sign In
            </button>
            <button className="btn-primary" onClick={() => navigate("/register")}>
              Get Started
            </button>
          </div>

          <button
            className={`hamburger ${menuOpen ? "hamburger--open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="grid-overlay" />
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Powered by Google Gemini AI
          </div>

          <h1 className="hero-title">
            Recruitment,<br />
            <em>Reimagined</em><br />
            <span className="hero-title-accent">with AI.</span>
          </h1>

          <p className="hero-subtitle">
            The complete staffing platform that matches candidates, generates
            contracts, and writes your job posts — all powered by cutting-edge
            artificial intelligence.
          </p>

          <div className="hero-cta">
            <button className="btn-hero-primary" onClick={() => navigate("/register")}>
              Start Free Today
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn-hero-secondary" onClick={() => navigate("/login")}>
              Sign In to Dashboard
            </button>
          </div>

          <div className="hero-roles">
            <span className="role-pill role-pill--candidate">For Candidates</span>
            <span className="role-divider">·</span>
            <span className="role-pill role-pill--employer">For Employers</span>
            <span className="role-divider">·</span>
            <span className="role-pill role-pill--admin">For Agencies</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="dashboard-mockup">
            <div className="mockup-bar">
              <span /><span /><span />
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar">
                {["Dashboard","Candidates","Vacancies","Orders","Placements","AI Tools"].map(item => (
                  <div key={item} className="mockup-nav-item">{item}</div>
                ))}
              </div>
              <div className="mockup-main">
                <div className="mockup-card mockup-card--highlight">
                  <div className="mockup-card-label">AI Match Score</div>
                  <div className="mockup-card-value">94%</div>
                  <div className="mockup-bar-row">
                    <div className="mockup-bar-fill" style={{width:"94%"}} />
                  </div>
                </div>
                <div className="mockup-candidates">
                  {[
                    { name: "Alex R.", score: 94, skills: "React · Node" },
                    { name: "Mia K.", score: 87, skills: "Java · Spring" },
                    { name: "Tom W.", score: 81, skills: "Python · ML" },
                  ].map((c) => (
                    <div key={c.name} className="mockup-candidate-row">
                      <div className="mockup-avatar">{c.name[0]}</div>
                      <div className="mockup-candidate-info">
                        <span className="mockup-name">{c.name}</span>
                        <span className="mockup-skills">{c.skills}</span>
                      </div>
                      <div className="mockup-score">{c.score}%</div>
                    </div>
                  ))}
                </div>
                <div className="mockup-ai-badge">
                  <span>⚡</span> AI Generated Bio Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section" ref={statsRef}>
        <div className="stats-inner">
          <StatItem value={12000} suffix="+" label="Candidates Placed" start={statsVisible} />
          <div className="stats-divider" />
          <StatItem value={3400} suffix="+" label="Employers Onboarded" start={statsVisible} />
          <div className="stats-divider" />
          <StatItem value={98} suffix="%" label="Client Satisfaction" start={statsVisible} />
          <div className="stats-divider" />
          <StatItem value={60} suffix="%" label="Faster Hiring" start={statsVisible} />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section" id="features">
        <div className="section-header">
          <div className="section-eyebrow">Platform Features</div>
          <h2 className="section-title">Everything your agency needs,<br />powered by AI</h2>
          <p className="section-sub">
            Eight AI-powered modules working together to automate the
            most time-consuming parts of recruitment.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i} style={{"--delay": `${i * 80}ms`}}>
              <div className="feature-top">
                <span className="feature-icon">{f.icon}</span>
                <span className="feature-tag">{f.tag}</span>
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <div className="feature-line" />
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-section" id="how-it-works">
        <div className="how-inner">
          <div className="section-header section-header--light">
            <div className="section-eyebrow section-eyebrow--light">Process</div>
            <h2 className="section-title section-title--light">
              From posting to placement<br />in four steps
            </h2>
          </div>

          <div className="steps-track">
            {steps.map((s, i) => (
              <div className="step-item" key={i}>
                <div className="step-num">{s.num}</div>
                <div className="step-connector" />
                <div className="step-body">
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles Section ── */}
      <section className="roles-section">
        <div className="section-header">
          <div className="section-eyebrow">Three Roles</div>
          <h2 className="section-title">Built for every stakeholder</h2>
        </div>

        <div className="roles-grid">
          <div className="role-card role-card--candidate">
            <div className="role-card-icon">👤</div>
            <h3>Candidate</h3>
            <ul>
              <li>AI-generated professional bio</li>
              <li>Browse & apply to vacancies</li>
              <li>Track application status</li>
              <li>Download placement contracts</li>
            </ul>
            <button className="btn-role" onClick={() => navigate("/register")}>
              Join as Candidate
            </button>
          </div>

          <div className="role-card role-card--employer role-card--featured">
            <div className="role-card-badge">Most Popular</div>
            <div className="role-card-icon">🏢</div>
            <h3>Employer</h3>
            <ul>
              <li>AI vacancy generator & filter</li>
              <li>Place staffing orders</li>
              <li>AI candidate recommendations</li>
              <li>Shortlist & manage applicants</li>
            </ul>
            <button className="btn-role btn-role--featured" onClick={() => navigate("/register")}>
              Join as Employer
            </button>
          </div>

          <div className="role-card role-card--admin">
            <div className="role-card-icon">⚙️</div>
            <h3>Administrator</h3>
            <ul>
              <li>Full platform oversight</li>
              <li>AI contract generation</li>
              <li>Blog & email AI tools</li>
              <li>Manage all users & placements</li>
            </ul>
            <button className="btn-role" onClick={() => navigate("/register")}>
              Admin Access
            </button>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-header section-header--light">
          <div className="section-eyebrow section-eyebrow--light">Testimonials</div>
          <h2 className="section-title section-title--light">Trusted by recruitment leaders</h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div className="testimonial-card" key={i}>
              <div className="testimonial-quote">"</div>
              <p className="testimonial-text">{t.quote}</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.avatar}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-orb" />
          <h2 className="cta-title">Ready to transform<br />your recruitment?</h2>
          <p className="cta-sub">
            Join thousands of agencies already using IntelliRecruit to hire faster,
            smarter, and with less effort.
          </p>
          <div className="cta-actions">
            <button className="btn-cta-primary" onClick={() => navigate("/register")}>
              Create Free Account
            </button>
            <button className="btn-cta-ghost" onClick={() => navigate("/login")}>
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="brand-icon">⬡</span>
            <span className="brand-text">IntelliRecruit</span>
            <p className="footer-tagline">AI-powered recruitment for modern agencies.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <div className="footer-col-title">Platform</div>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="/login">Sign In</a>
              <a href="/register">Register</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Roles</div>
              <a href="/register">Candidate</a>
              <a href="/register">Employer</a>
              <a href="/register">Administrator</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Technology</div>
              <a href="#">Spring Boot</a>
              <a href="#">Google Gemini AI</a>
              <a href="#">React Frontend</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 IntelliRecruit. All rights reserved.</span>
          <span>Built with Spring Boot · React · Google Gemini</span>
        </div>
      </footer>
    </div>
  );
}