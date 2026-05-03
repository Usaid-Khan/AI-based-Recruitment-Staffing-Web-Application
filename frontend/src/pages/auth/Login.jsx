import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";
import authService from "../../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await authService.login(form.email, form.password);
      
      const role = data.role;
      if (role === "ADMIN") navigate("/admin/dashboard");
      else if (role === "EMPLOYER") navigate("/employer/dashboard");
      else navigate("/candidate/dashboard");
    } catch (err) {
      if (err.message === "Network Error") {
        setError("Unable to connect to the server. Please ensure the backend is running on port 8080.");
      } else {
        // Handle both object-based messages and plain string responses
        const backendMessage = typeof err.response?.data === 'string' 
          ? err.response.data 
          : err.response?.data?.message;
          
        setError(backendMessage || err.message || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* ── Ambient background ── */}
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
        <div className="auth-orb auth-orb--3" />
      </div>

      {/* ── Left panel — branding ── */}
      <div className="auth-panel auth-panel--left">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">⬡</span>
          <span className="auth-brand-text">IntelliRecruit</span>
        </Link>

        <div className="auth-panel-content">
          <div className="auth-panel-eyebrow">Welcome back</div>
          <h1 className="auth-panel-title">
            Sign in to your<br />
            <em>workspace</em>
          </h1>
          <p className="auth-panel-sub">
            Access your AI-powered recruitment dashboard.
            Manage candidates, vacancies, and placements — all in one place.
          </p>

          <div className="auth-features">
            {[
              { icon: "✦", text: "AI candidate recommendations" },
              { icon: "◈", text: "Smart bio & contract generation" },
              { icon: "◉", text: "Real-time application tracking" },
            ].map((f) => (
              <div className="auth-feature-row" key={f.text}>
                <span className="auth-feature-icon">{f.icon}</span>
                <span className="auth-feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative corner geometric */}
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

      {/* ── Right panel — form ── */}
      <div className="auth-panel auth-panel--right">
        <div className="auth-form-wrapper">

          {/* Mobile brand */}
          <Link to="/" className="auth-brand auth-brand--mobile">
            <span className="auth-brand-icon">⬡</span>
            <span className="auth-brand-text">IntelliRecruit</span>
          </Link>

          <div className="auth-form-header">
            <h2 className="auth-form-title">Sign In</h2>
            <p className="auth-form-sub">
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">Create one free</Link>
            </p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <span className="auth-error-icon">⚠</span>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className={`auth-field ${focused === "email" ? "auth-field--focused" : ""} ${form.email ? "auth-field--filled" : ""}`}>
              <label className="auth-label" htmlFor="email">Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </span>
                <input
                  id="email"
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
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="password">Password</label>
                <a href="#" className="auth-forgot">Forgot password?</a>
              </div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    <circle cx="8" cy="11" r="1" fill="currentColor"/>
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  placeholder="Your password"
                  className="auth-input"
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.4"/>
                      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.4"/>
                      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="auth-checkbox-row">
              <input type="checkbox" className="auth-checkbox" />
              <span className="auth-checkbox-custom" />
              <span className="auth-checkbox-label">Keep me signed in</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              className={`auth-submit ${loading ? "auth-submit--loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span>or continue with role</span>
            </div>

            {/* Role quick-access */}
            <div className="auth-role-grid">
              {[
                { label: "Candidate", icon: "👤", hint: "Find opportunities" },
                { label: "Employer", icon: "🏢", hint: "Post vacancies" },
                { label: "Admin", icon: "⚙️", hint: "Manage platform" },
              ].map((r) => (
                <button
                  key={r.label}
                  type="button"
                  className="auth-role-btn"
                  onClick={() => navigate("/register")}
                >
                  <span className="auth-role-emoji">{r.icon}</span>
                  <span className="auth-role-name">{r.label}</span>
                  <span className="auth-role-hint">{r.hint}</span>
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}