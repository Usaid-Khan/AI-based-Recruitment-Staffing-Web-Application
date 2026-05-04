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
        setError("Unable to connect to the server. Please check your internet connection or try again later.");
      } else {
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
      <div className="auth-panel">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">⬡</span>
          <span className="auth-brand-text">IntelliRecruit</span>
        </Link>

        <div className="auth-form-header">
          <h2 className="auth-form-title">Sign In</h2>
          <p className="auth-form-sub">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">Create one</Link>
          </p>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            <span className="auth-error-icon">⚠</span>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email Address</label>
            <div className="auth-input-wrap">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="password">Password</label>
              <a href="#" className="auth-forgot">Forgot password?</a>
            </div>
            <div className="auth-input-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
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

          <label className="auth-checkbox-row">
            <input type="checkbox" className="auth-checkbox" />
            <span className="auth-checkbox-custom" />
            <span className="auth-checkbox-label">Keep me signed in</span>
          </label>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="auth-divider">
            <span>or continue with role</span>
          </div>

          <div className="auth-role-grid">
            {[
              { 
                label: "Candidate", 
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                )
              },
              { 
                label: "Employer", 
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                )
              },
              { 
                label: "Admin", 
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                )
              },
            ].map((r) => (
              <button
                key={r.label}
                type="button"
                className="auth-role-btn"
                onClick={() => navigate("/register")}
              >
                <span className="auth-role-icon">{r.icon}</span>
                <span className="auth-role-name">{r.label}</span>
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}