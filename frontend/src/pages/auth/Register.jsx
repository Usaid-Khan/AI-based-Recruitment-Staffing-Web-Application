import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";
import authService from "../../services/authService";

const ROLES = [
  {
    value: "CANDIDATE",
    icon: "👤",
    label: "Candidate",
    desc: "Find jobs, build your AI-powered profile, and get placed.",
  },
  {
    value: "EMPLOYER",
    icon: "🏢",
    label: "Employer",
    desc: "Post vacancies, place orders, and find top talent with AI.",
  },
  {
    value: "ADMIN",
    icon: "⚙️",
    label: "Administrator",
    desc: "Full platform access with AI tools and agency management.",
  },
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = role, 2 = details
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const selectRole = (role) => {
    setForm({ ...form, role });
    setStep(2);
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
    if (score <= 2) return { score, label: "Fair", color: "#f59e0b" };
    if (score <= 3) return { score, label: "Good", color: "#2dd4bf" };
    return { score, label: "Strong", color: "#22c55e" };
  };

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Register
      await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      // Automatically Login after registration
      const data = await authService.login(form.email, form.password);
      
      if (data.role === "ADMIN") navigate("/admin/dashboard");
      else if (data.role === "EMPLOYER") navigate("/employer/dashboard");
      else navigate("/candidate/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find((r) => r.value === form.role);

  return (
    <div className="auth-root">
      {/* ── Ambient background ── */}
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
        <div className="auth-orb auth-orb--3" />
      </div>

      {/* ── Left panel ── */}
      <div className="auth-panel auth-panel--left">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">⬡</span>
          <span className="auth-brand-text">IntelliRecruit</span>
        </Link>

        <div className="auth-panel-content">
          <div className="auth-panel-eyebrow">Join today</div>
          <h1 className="auth-panel-title">
            Start your<br />
            <em>AI-powered</em><br />
            journey.
          </h1>
          <p className="auth-panel-sub">
            Whether you're looking for work, hiring talent, or managing an
            agency — IntelliRecruit gives you the AI tools to do it better.
          </p>

          {/* Step indicator */}
          <div className="auth-steps-indicator">
            <div className={`auth-step-dot ${step >= 1 ? "auth-step-dot--active" : ""}`}>
              <span>1</span>
            </div>
            <div className={`auth-step-line ${step >= 2 ? "auth-step-line--active" : ""}`} />
            <div className={`auth-step-dot ${step >= 2 ? "auth-step-dot--active" : ""}`}>
              <span>2</span>
            </div>
            <div className="auth-step-labels">
              <span>Choose role</span>
              <span>Your details</span>
            </div>
          </div>

          {selectedRole && (
            <div className="auth-selected-role">
              <span className="auth-selected-role-icon">{selectedRole.icon}</span>
              <div>
                <div className="auth-selected-role-name">
                  Registering as {selectedRole.label}
                </div>
                <div className="auth-selected-role-desc">{selectedRole.desc}</div>
              </div>
            </div>
          )}
        </div>

        <div className="auth-panel-deco">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
            <polygon points="100,10 190,55 190,145 100,190 10,145 10,55"
              stroke="rgba(201,168,76,0.15)" strokeWidth="1" fill="none"/>
            <polygon points="100,30 170,67 170,133 100,170 30,133 30,67"
              stroke="rgba(201,168,76,0.1)" strokeWidth="1" fill="none"/>
            <polygon points="100,50 150,79 150,121 100,150 50,121 50,79"
              stroke="rgba(201,168,76,0.08)" strokeWidth="1" fill="none"/>
            <circle cx="100" cy="100" r="6" fill="rgba(201,168,76,0.4)"/>
            <circle cx="100" cy="100" r="3" fill="#c9a84c"/>
          </svg>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-panel auth-panel--right">
        <div className="auth-form-wrapper">

          {/* Mobile brand */}
          <Link to="/" className="auth-brand auth-brand--mobile">
            <span className="auth-brand-icon">⬡</span>
            <span className="auth-brand-text">IntelliRecruit</span>
          </Link>

          {/* ══ STEP 1 — Role Selection ══ */}
          {step === 1 && (
            <div className="auth-step-panel" key="step1">
              <div className="auth-form-header">
                <h2 className="auth-form-title">Create Account</h2>
                <p className="auth-form-sub">
                  Already have an account?{" "}
                  <Link to="/login" className="auth-link">Sign in</Link>
                </p>
              </div>

              <div className="auth-role-select-label">
                Select your role to get started
              </div>

              <div className="auth-role-cards">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className={`auth-role-card ${form.role === r.value ? "auth-role-card--selected" : ""}`}
                    onClick={() => selectRole(r.value)}
                  >
                    <div className="auth-role-card-top">
                      <span className="auth-role-card-icon">{r.icon}</span>
                      {r.value === "EMPLOYER" && (
                        <span className="auth-role-card-badge">Popular</span>
                      )}
                    </div>
                    <div className="auth-role-card-label">{r.label}</div>
                    <div className="auth-role-card-desc">{r.desc}</div>
                    <div className="auth-role-card-arrow">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              <p className="auth-terms">
                By creating an account you agree to our{" "}
                <a href="#" className="auth-link">Terms of Service</a> and{" "}
                <a href="#" className="auth-link">Privacy Policy</a>.
              </p>
            </div>
          )}

          {/* ══ STEP 2 — Details Form ══ */}
          {step === 2 && (
            <div className="auth-step-panel" key="step2">
              <div className="auth-form-header">
                <button
                  type="button"
                  className="auth-back-btn"
                  onClick={() => { setStep(1); setError(""); }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
                <h2 className="auth-form-title" style={{ marginTop: "16px" }}>
                  Your Details
                </h2>
                <p className="auth-form-sub">
                  Already have an account?{" "}
                  <Link to="/login" className="auth-link">Sign in</Link>
                </p>
              </div>

              {error && (
                <div className="auth-error" role="alert">
                  <span className="auth-error-icon">⚠</span>
                  {error}
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit} noValidate>

                {/* Full Name */}
                <div className={`auth-field ${focused === "name" ? "auth-field--focused" : ""} ${form.name ? "auth-field--filled" : ""}`}>
                  <label className="auth-label" htmlFor="name">Full Name</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"
                          stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={handleChange}
                      onFocus={() => setFocused("name")}
                      onBlur={() => setFocused("")}
                      placeholder="John Doe"
                      className="auth-input"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className={`auth-field ${focused === "email" ? "auth-field--focused" : ""} ${form.email ? "auth-field--filled" : ""}`}>
                  <label className="auth-label" htmlFor="reg-email">Email Address</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="3" width="14" height="10" rx="2"
                          stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M1 5l7 5 7-5" stroke="currentColor"
                          strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused("")}
                      placeholder="you@company.com"
                      className="auth-input"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className={`auth-field ${focused === "password" ? "auth-field--focused" : ""} ${form.password ? "auth-field--filled" : ""}`}>
                  <label className="auth-label" htmlFor="reg-password">Password</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="3" y="7" width="10" height="8" rx="1.5"
                          stroke="currentColor" strokeWidth="1.4"/>
                        <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor"
                          strokeWidth="1.4" strokeLinecap="round"/>
                        <circle cx="8" cy="11" r="1" fill="currentColor"/>
                      </svg>
                    </span>
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={handleChange}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused("")}
                      placeholder="Min. 6 characters"
                      className="auth-input"
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
                            stroke="currentColor" strokeWidth="1.4"/>
                          <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
                          <path d="M3 3l10 10" stroke="currentColor"
                            strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
                            stroke="currentColor" strokeWidth="1.4"/>
                          <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {form.password && (
                    <div className="auth-strength">
                      <div className="auth-strength-bars">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="auth-strength-bar"
                            style={{
                              background: i <= strength.score
                                ? strength.color
                                : "rgba(255,255,255,0.08)",
                            }}
                          />
                        ))}
                      </div>
                      <span
                        className="auth-strength-label"
                        style={{ color: strength.color }}
                      >
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className={`auth-field ${focused === "confirm" ? "auth-field--focused" : ""} ${form.confirmPassword ? "auth-field--filled" : ""}`}>
                  <label className="auth-label" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3 3 7-7" stroke="currentColor"
                          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFocused("confirm")}
                      onBlur={() => setFocused("")}
                      placeholder="Repeat your password"
                      className={`auth-input ${
                        form.confirmPassword &&
                        form.password !== form.confirmPassword
                          ? "auth-input--error"
                          : ""
                      } ${
                        form.confirmPassword &&
                        form.password === form.confirmPassword
                          ? "auth-input--success"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
                            stroke="currentColor" strokeWidth="1.4"/>
                          <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
                          <path d="M3 3l10 10" stroke="currentColor"
                            strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
                            stroke="currentColor" strokeWidth="1.4"/>
                          <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
                        </svg>
                      )}
                    </button>
                    {form.confirmPassword &&
                      form.password === form.confirmPassword && (
                        <span className="auth-match-tick">✓</span>
                      )}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className={`auth-submit ${loading ? "auth-submit--loading" : ""}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="auth-spinner" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor"
                          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>

                <p className="auth-terms" style={{ marginTop: "16px" }}>
                  By registering you agree to our{" "}
                  <a href="#" className="auth-link">Terms of Service</a> and{" "}
                  <a href="#" className="auth-link">Privacy Policy</a>.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}