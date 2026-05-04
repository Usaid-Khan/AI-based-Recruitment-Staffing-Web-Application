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

/* ─── Typewriter hook ─── */
const TYPEWRITER_PHRASES = [
  "8 AI modules automating your recruitment.",
  "Gemini AI matching & scores in seconds.",
  "Auto-generate bios, posts & contracts.",
  "One platform for your full placement flow.",
];

function useTypewriter(phrases, typingSpeed = 40, eraseSpeed = 20, pauseMs = 2200) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [erasing, setErasing] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      const t = setTimeout(() => { setPaused(false); setErasing(true); }, pauseMs);
      return () => clearTimeout(t);
    }
    const phrase = phrases[phraseIdx];
    if (!erasing) {
      if (charIdx < phrase.length) {
        const t = setTimeout(() => {
          setDisplayed(phrase.slice(0, charIdx + 1));
          setCharIdx(c => c + 1);
        }, typingSpeed);
        return () => clearTimeout(t);
      } else {
        setPaused(true);
      }
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => {
          setDisplayed(phrase.slice(0, charIdx - 1));
          setCharIdx(c => c - 1);
        }, eraseSpeed);
        return () => clearTimeout(t);
      } else {
        setErasing(false);
        setPhraseIdx(i => (i + 1) % phrases.length);
      }
    }
  }, [charIdx, erasing, paused, phraseIdx, phrases, typingSpeed, eraseSpeed, pauseMs]);

  return displayed;
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
  const mockupRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const navRef = useRef(null);
  const useTypewriterDisplay = useTypewriter(TYPEWRITER_PHRASES);


  /* ── 3D tilt handlers ── */
  const handleTiltMove = (e) => {
    const el = mockupRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;   // px from left edge
    const y = e.clientY - rect.top;    // px from top edge
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    // Normalise to -1 … +1
    const nx = (x - cx) / cx;
    const ny = (y - cy) / cy;
    // rotateX: mouse near top → tilt top toward viewer (+X)
    // rotateY: mouse near right → tilt right toward viewer (+Y)
    const rotX = ny * -12;
    const rotY = nx * 12;
    el.style.transition = 'transform 0.08s linear';
    el.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  };

  const handleTiltLeave = () => {
    const el = mockupRef.current;
    if (!el) return;
    el.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
    el.style.transform = 'perspective(1200px) rotateY(-8deg) rotateX(4deg)';
  };

  const handleSpotlight = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--mouse-x", `${x}px`);
    el.style.setProperty("--mouse-y", `${y}px`);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for Scroll Spy
  useEffect(() => {
    const sections = ["features", "how-it-works", "testimonials"];
    const observerOptions = {
      root: null,
      rootMargin: "-40% 0px -40% 0px", // Detect when section is in middle of screen
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Only set active if we've scrolled a bit past the hero
          if (window.scrollY > 200) {
            setActiveSection(entry.target.id);
          } else {
            setActiveSection("");
          }
        }
      });
    };


    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Update nav pill position
  useEffect(() => {
    // If at the very top, always hide the pill
    const handleTopScroll = () => {
      if (window.scrollY < 150) {
        setActiveSection("");
      }
    };
    window.addEventListener("scroll", handleTopScroll);

    if (!activeSection || !navRef.current) {
      setPillStyle(prev => ({ ...prev, opacity: 0 }));
      return () => window.removeEventListener("scroll", handleTopScroll);
    }

    const activeLink = navRef.current.querySelector(`a[href="#${activeSection}"]`);
    if (activeLink) {
      setPillStyle({
        left: activeLink.offsetLeft,
        width: activeLink.offsetWidth,
        opacity: 1
      });
    } else {
      setPillStyle(prev => ({ ...prev, opacity: 0 }));
    }

    return () => window.removeEventListener("scroll", handleTopScroll);
  }, [activeSection]);


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
    { name: "Marcus Thorne", role: "Founder, Thorne Tech", quote: "The AI vacancy generator is the best I've used. It understands exactly what we need.", avatar: "MT" },
    { name: "Elena Rossi", role: "Operations Lead, Global Recruit", quote: "From order to signed contract, everything is streamlined. Simply amazing.", avatar: "ER" },
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

          <ul className={`nav-links ${menuOpen ? "nav-links--open" : ""}`} ref={navRef}>
            {activeSection && (
              <div 
                className="nav-pill" 
                style={{
                  transform: `translateX(${pillStyle.left}px)`,
                  width: `${pillStyle.width}px`,
                  opacity: pillStyle.opacity
                }}
              />
            )}
            <li><a href="#features" className={activeSection === "features" ? "active" : ""} onClick={() => setMenuOpen(false)}>Features</a></li>
            <li><a href="#how-it-works" className={activeSection === "how-it-works" ? "active" : ""} onClick={() => setMenuOpen(false)}>How It Works</a></li>
            <li><a href="#testimonials" className={activeSection === "testimonials" ? "active" : ""} onClick={() => setMenuOpen(false)}>Testimonials</a></li>
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
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
          <div
            className="dashboard-mockup"
            ref={mockupRef}
            onMouseMove={handleTiltMove}
            onMouseLeave={handleTiltLeave}
          >
            <div className="mockup-bar">
              <span /><span /><span />
            </div>
            <div className="mockup-body">
              <div className="mockup-sidebar">
                {["Dashboard", "Candidates", "Vacancies", "Orders", "Placements", "AI Tools"].map(item => (
                  <div key={item} className="mockup-nav-item">{item}</div>
                ))}
              </div>
              <div className="mockup-main">
                <div className="mockup-card mockup-card--highlight">
                  <div className="mockup-card-label">AI Match Score</div>
                  <div className="mockup-card-value">94%</div>
                  <div className="mockup-bar-row">
                    <div className="mockup-bar-fill" style={{ width: "94%" }} />
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
          <p className="section-sub typewriter-sub">
            <span>{useTypewriterDisplay}</span>
            <span className="typewriter-cursor">|</span>
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div
              className="feature-card"
              key={i}
              style={{ "--delay": `${i * 80}ms` }}
              onMouseMove={handleSpotlight}
            >
              <div className="feature-spotlight" />
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

        <div
          className="roles-grid"
          onMouseMove={handleSpotlight}
        >
          <div className="role-card role-card--candidate">
            <div className="feature-spotlight" />
            <div className="role-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3>Candidate</h3>
            <ul>
              <li>AI-generated professional bio</li>
              <li>Browse & apply to vacancies</li>
              <li>Track application status</li>
              <li>Download placement contracts</li>
            </ul>
            <button className="btn-role btn-role--featured" onClick={() => navigate("/register")}>
              Join as Candidate
            </button>
          </div>

          <div className="role-card role-card--employer">
            <div className="feature-spotlight" />
            <div className="role-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
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
            <div className="feature-spotlight" />
            <div className="role-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>Administrator</h3>
            <ul>
              <li>Full platform oversight</li>
              <li>AI contract generation</li>
              <li>Blog & email AI tools</li>
              <li>Manage all users & placements</li>
            </ul>
            <button className="btn-role btn-role--featured" onClick={() => navigate("/register")}>
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

        <div className="testimonials-track">
          <div className="testimonials-tape">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div className="testimonial-card" key={i}>
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">{t.quote}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div className="testimonial-meta">
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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