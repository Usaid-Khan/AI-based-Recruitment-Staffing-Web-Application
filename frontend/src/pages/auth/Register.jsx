import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";
import authService from "../../services/authService";

const ROLES = [
  {
    value: "CANDIDATE",
    label: "Candidate",
    desc: "Find jobs, build your profile, and get placed.",
  },
  {
    value: "EMPLOYER",
    label: "Employer",
    desc: "Post vacancies and find top talent.",
  },
  {
    value: "ADMIN",
    label: "Administrator",
    desc: "Full platform access and management.",
  },
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const selectRole = (role) => {
    setForm({ ...form, role });
    setStep(2);
  };

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
      await authService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });

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

  return (
    <div className="auth-root">
      <div className="auth-panel">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">⬡</span>
          <span className="auth-brand-text">IntelliRecruit</span>
        </Link>

        {step === 1 && (
          <div className="auth-step-panel">
            <div className="auth-form-header">
              <h2 className="auth-form-title">Create Account</h2>
              <p className="auth-form-sub">
                Already have an account?{" "}
                <Link to="/login" className="auth-link">Sign in</Link>
              </p>
            </div>

            <div className="auth-role-select-label">Select your role to get started:</div>
            
            <div className="auth-role-cards">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`auth-role-card ${form.role === r.value ? "auth-role-card--selected" : ""}`}
                  onClick={() => selectRole(r.value)}
                >
                  <div className="auth-role-card-top">
                    <span className="auth-role-card-label">{r.label}</span>
                  </div>
                  <div className="auth-role-card-desc">{r.desc}</div>
                </button>
              ))}
            </div>

            <p className="auth-terms">
              By creating an account you agree to our{" "}
              <a href="#" className="auth-link">Terms</a> and{" "}
              <a href="#" className="auth-link">Privacy Policy</a>.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="auth-step-panel">
            <button
              type="button"
              className="auth-back-btn"
              onClick={() => { setStep(1); setError(""); }}
            >
              ← Back to Roles
            </button>

            <div className="auth-form-header" style={{ marginBottom: "20px" }}>
              <h2 className="auth-form-title">Your Details</h2>
              <p className="auth-form-sub">
                Registering as {ROLES.find(r => r.value === form.role)?.label}
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
                <label className="auth-label" htmlFor="name">Full Name</label>
                <div className="auth-input-wrap">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="auth-input"
                  />
                </div>
              </div>

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
                <label className="auth-label" htmlFor="password">Password</label>
                <div className="auth-input-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className="auth-input"
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
                <div className="auth-input-wrap">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    className={`auth-input ${
                      form.confirmPassword && form.password !== form.confirmPassword ? "auth-input--error" : ""
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
                style={{ marginTop: "12px" }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}