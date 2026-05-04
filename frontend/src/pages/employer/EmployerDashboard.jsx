import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Briefcase, 
  PlusSquare, 
  Users, 
  ClipboardList, 
  Settings, 
  LogOut,
  UserCheck,
  Building,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  X,
  Sparkles
} from "lucide-react";
import "./EmployerDashboard.css";
import api from "../../services/api";

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
async function apiFetch(path, opts = {}) {
  try {
    const { method = 'GET', body, params } = opts;
    const response = await api({
      url: path,
      method,
      data: body ? (typeof body === 'string' ? JSON.parse(body) : body) : undefined,
      params
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data || error.message || "Request failed";
    throw new Error(message);
  }
}

function useCountUp(target, duration = 1800, trigger = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger || !target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [trigger, target, duration]);
  return val;
}

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */

/* Sidebar nav item */
function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      className={`ed-nav-item ${active ? "ed-nav-item--active" : ""}`}
      onClick={onClick}
    >
      <span className="ed-nav-icon">{icon}</span>
      <span className="ed-nav-label">{label}</span>
      {badge > 0 && <span className="ed-nav-badge">{badge}</span>}
    </button>
  );
}

/* Stat card */
function StatCard({ icon, label, value, sub, color, delay, trigger }) {
  const count = useCountUp(typeof value === "number" ? value : 0, 1600, trigger);
  return (
    <div
      className="ed-stat-card"
      style={{ "--delay": delay, "--accent": color }}
    >
      <div className="ed-stat-icon">{icon}</div>
      <div className="ed-stat-body">
        <div className="ed-stat-value">
          {typeof value === "number" ? count : value}
        </div>
        <div className="ed-stat-label">{label}</div>
        {sub && <div className="ed-stat-sub">{sub}</div>}
      </div>
      <div className="ed-stat-glow" />
    </div>
  );
}

/* Status badge */
function Badge({ status }) {
  const map = {
    OPEN:        { label: "Open",        cls: "badge--open" },
    CLOSED:      { label: "Closed",      cls: "badge--closed" },
    DRAFT:       { label: "Draft",       cls: "badge--draft" },
    PENDING:     { label: "Pending",     cls: "badge--pending" },
    IN_PROGRESS: { label: "In Progress", cls: "badge--progress" },
    FULFILLED:   { label: "Fulfilled",   cls: "badge--fulfilled" },
    CANCELLED:   { label: "Cancelled",   cls: "badge--cancelled" },
    APPLIED:     { label: "Applied",     cls: "badge--applied" },
    SHORTLISTED: { label: "Shortlisted", cls: "badge--shortlisted" },
    OFFERED:     { label: "Offered",     cls: "badge--offered" },
    REJECTED:    { label: "Rejected",    cls: "badge--rejected" },
  };
  const { label, cls } = map[status] || { label: status, cls: "" };
  return <span className={`ed-badge ${cls}`}>{label}</span>;
}

/* Empty state */
function Empty({ icon, title, sub, action, onAction }) {
  return (
    <div className="ed-empty">
      <div className="ed-empty-icon">{icon}</div>
      <div className="ed-empty-title">{title}</div>
      <div className="ed-empty-sub">{sub}</div>
      {action && (
        <button className="ed-btn ed-btn--gold" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

/* Modal wrapper */
function Modal({ open, onClose, title, children, width = 560 }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="ed-modal-overlay" onClick={onClose}>
      <div
        className="ed-modal"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ed-modal-header">
          <h3 className="ed-modal-title">{title}</h3>
          <button className="ed-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="ed-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* Field component for forms */
function Field({ label, children, hint }) {
  return (
    <div className="ed-field">
      <label className="ed-field-label">{label}</label>
      {children}
      {hint && <span className="ed-field-hint">{hint}</span>}
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Overview
───────────────────────────────────────── */
function Overview({ employer, vacancies, orders, applications, onNavigate }) {
  const statsRef = useRef(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setTriggered(true),
      { threshold: 0.2 }
    );
    if (statsRef.current) io.observe(statsRef.current);
    return () => io.disconnect();
  }, []);

  const openVacancies = vacancies.filter((v) => v.status === "OPEN").length;
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const totalApps = applications.length;
  const shortlisted = applications.filter(
    (a) => a.status === "SHORTLISTED"
  ).length;

  const recentVacancies = [...vacancies]
    .sort((a, b) => b.id - a.id)
    .slice(0, 4);

  const recentApps = [...applications]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  return (
    <div className="ed-section">
      {/* Welcome strip */}
      <div className="ed-welcome-strip">
        <div className="ed-welcome-left">
          <div className="ed-welcome-eyebrow">Employer Dashboard</div>
          <h1 className="ed-welcome-title">
            Welcome back,{" "}
            <em>{employer?.companyName || "your company"}</em>
          </h1>
          <p className="ed-welcome-sub">
            {employer?.industry && (
              <span className="ed-industry-tag">{employer.industry}</span>
            )}
            Here's your recruitment overview for today.
          </p>
        </div>
        <div className="ed-welcome-actions">
          <button
            className="ed-btn ed-btn--ghost"
            onClick={() => onNavigate("vacancies")}
          >
            View Vacancies
          </button>
          <button
            className="ed-btn ed-btn--gold"
            onClick={() => onNavigate("post-vacancy")}
          >
            <PlusSquare size={18} /> Post Vacancy
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="ed-stats-grid" ref={statsRef}>
        <StatCard
          icon={<Briefcase size={22} />}
          label="Open Vacancies"
          value={openVacancies}
          sub="Active job postings"
          color="var(--c-text)"
          delay="0ms"
          trigger={triggered}
        />
        <StatCard
          icon={<Users size={22} />}
          label="Total Applications"
          value={totalApps}
          sub="Across all vacancies"
          color="var(--c-text)"
          delay="80ms"
          trigger={triggered}
        />
        <StatCard
          icon={<UserCheck size={22} />}
          label="Shortlisted"
          value={shortlisted}
          sub="Ready for interview"
          color="var(--c-text-dim)"
          delay="160ms"
          trigger={triggered}
        />
        <StatCard
          icon={<ClipboardList size={22} />}
          label="Pending Orders"
          value={pendingOrders}
          sub="Awaiting fulfilment"
          color="var(--c-text-muted)"
          delay="240ms"
          trigger={triggered}
        />
      </div>

      {/* Two-column grid */}
      <div className="ed-overview-grid">
        {/* Recent vacancies */}
        <div className="ed-overview-card">
          <div className="ed-card-header">
            <span className="ed-card-title">Recent Vacancies</span>
            <button
              className="ed-card-link"
              onClick={() => onNavigate("vacancies")}
            >
              View all →
            </button>
          </div>
          {recentVacancies.length === 0 ? (
            <Empty
              icon="◈"
              title="No vacancies yet"
              sub="Post your first job vacancy"
              action="Post Vacancy"
              onAction={() => onNavigate("post-vacancy")}
            />
          ) : (
            <div className="ed-vacancy-list">
              {recentVacancies.map((v) => (
                <div className="ed-vacancy-row" key={v.id}>
                  <div className="ed-vacancy-row-left">
                    <div className="ed-vacancy-row-title">{v.title}</div>
                    <div className="ed-vacancy-row-meta">
                      {v.salaryRange && (
                        <span className="ed-meta-pill">{v.salaryRange}</span>
                      )}
                    </div>
                  </div>
                  <Badge status={v.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="ed-overview-card">
          <div className="ed-card-header">
            <span className="ed-card-title">Recent Applications</span>
            <button
              className="ed-card-link"
              onClick={() => onNavigate("applications")}
            >
              View all →
            </button>
          </div>
          {recentApps.length === 0 ? (
            <Empty
              icon="◉"
              title="No applications yet"
              sub="Applications will appear once candidates apply"
            />
          ) : (
            <div className="ed-app-list">
              {recentApps.map((a) => (
                <div className="ed-app-row" key={a.id}>
                  <div className="ed-app-avatar">
                    {a.candidateName?.[0] || "?"}
                  </div>
                  <div className="ed-app-info">
                    <div className="ed-app-name">{a.candidateName}</div>
                    <div className="ed-app-vacancy">{a.vacancyTitle}</div>
                  </div>
                  <Badge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: My Vacancies
───────────────────────────────────────── */
function Vacancies({ vacancies, onRefresh, onNavigate }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = vacancies.filter((v) => {
    const matchSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.description || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || v.status === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/vacancies/${deleteId}`, { method: "DELETE" });
      onRefresh();
      setDeleteId(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="ed-section">
      <div className="ed-section-header">
        <div>
          <div className="ed-section-eyebrow">My Postings</div>
          <h2 className="ed-section-title">Vacancies</h2>
        </div>
        <button
          className="ed-btn ed-btn--gold"
          onClick={() => onNavigate("post-vacancy")}
        >
          <span>+</span> Post New Vacancy
        </button>
      </div>

      {/* Toolbar */}
      <div className="ed-toolbar">
        <div className="ed-search-wrap">
          <span className="ed-search-icon">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </span>
          <input
            className="ed-search"
            placeholder="Search vacancies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ed-filter-pills">
          {["ALL", "OPEN", "DRAFT", "CLOSED"].map((s) => (
            <button
              key={s}
              className={`ed-filter-pill ${filter === s ? "ed-filter-pill--active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon="◈"
          title="No vacancies found"
          sub={search ? "Try a different search term" : "Post your first vacancy to get started"}
          action={!search ? "Post Vacancy" : undefined}
          onAction={() => onNavigate("post-vacancy")}
        />
      ) : (
        <div className="ed-table-wrap">
          <table className="ed-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Salary Range</th>
                <th>Status</th>
                <th>Requirements</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.id} style={{ "--row-delay": `${i * 40}ms` }}>
                  <td>
                    <div className="ed-td-title">{v.title}</div>
                    {v.description && (
                      <div className="ed-td-sub">
                        {v.description.slice(0, 60)}
                        {v.description.length > 60 ? "…" : ""}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="ed-meta-pill">
                      {v.salaryRange || "—"}
                    </span>
                  </td>
                  <td><Badge status={v.status} /></td>
                  <td>
                    <div className="ed-td-sub">
                      {v.requirements
                        ? v.requirements.slice(0, 50) + (v.requirements.length > 50 ? "…" : "")
                        : "—"}
                    </div>
                  </td>
                  <td>
                    <div className="ed-action-row">
                      <button
                        className="ed-icon-btn ed-icon-btn--teal"
                        title="View applicants"
                        onClick={() => onNavigate("applications", v.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                          <path d="M1 12c0-2.21 1.79-3.5 4-3.5s4 1.29 4 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          <path d="M10 6l2.5 2.5L10 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className="ed-icon-btn ed-icon-btn--red"
                        title="Delete vacancy"
                        onClick={() => setDeleteId(v.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 3.5h10M5.5 3.5V2.5h3v1M4.5 3.5l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Vacancy"
        width={420}
      >
        <p className="ed-modal-text">
          Are you sure you want to delete this vacancy? This action cannot be
          undone and all associated applications will be affected.
        </p>
        <div className="ed-modal-actions">
          <button
            className="ed-btn ed-btn--ghost"
            onClick={() => setDeleteId(null)}
          >
            Cancel
          </button>
          <button
            className="ed-btn ed-btn--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete Vacancy"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Post Vacancy
───────────────────────────────────────── */
function PostVacancy({ employer, onSuccess, aiEnabled = true }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    salaryRange: "",
    status: "OPEN",
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [aiParams, setAiParams] = useState({
    jobTitle: "",
    experienceLevel: "Mid-level",
    keySkills: "",
  });
  const [showAiPanel, setShowAiPanel] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAiGenerate = async () => {
    if (!aiParams.jobTitle) {
      setError("Please enter a job title for AI generation.");
      return;
    }
    setAiLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        jobTitle: aiParams.jobTitle,
        experienceLevel: aiParams.experienceLevel,
        keySkills: aiParams.keySkills,
      });
      const data = await apiFetch(
        `/ai/employers/${employer.id}/generate-vacancy?${params}`,
        { method: "POST" }
      );
      // Parse AI output into form fields
      const content = data.content || "";
      setForm((f) => ({
        ...f,
        title: aiParams.jobTitle,
        description: content.slice(0, 800),
        requirements: content.slice(800, 1400),
      }));
      setShowAiPanel(false);
    } catch (e) {
      setError("AI generation failed: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) { setError("Job title is required."); return; }
    setLoading(true);
    setError("");
    try {
      await apiFetch("/vacancies", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSuccess(true);
      setForm({ title: "", description: "", requirements: "", salaryRange: "", status: "OPEN" });
      setTimeout(() => { setSuccess(false); onSuccess(); }, 1800);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ed-section">
      <div className="ed-section-header">
        <div>
          <div className="ed-section-eyebrow">Create Posting</div>
          <h2 className="ed-section-title">Post a Vacancy</h2>
        </div>
      </div>

      {/* AI generator panel toggle */}
      {aiEnabled && (
        <div className="ed-ai-banner">
          <div className="ed-ai-banner-left">
            <span className="ed-ai-badge">
              <span className="ed-ai-dot" />
              Gemini AI
            </span>
            <span className="ed-ai-banner-text">
              Let AI write a professional vacancy for you in seconds.
            </span>
          </div>
          <button
            className="ed-btn ed-btn--teal-outline"
            onClick={() => setShowAiPanel(!showAiPanel)}
          >
            {showAiPanel ? "Hide AI Panel" : "Generate with AI ✦"}
          </button>
        </div>
      )}

      {/* AI panel */}
      {showAiPanel && (
        <div className="ed-ai-panel">
          <div className="ed-ai-panel-title">AI Vacancy Generator</div>
          <div className="ed-ai-panel-grid">
            <Field label="Job Title *">
              <input
                className="ed-input"
                placeholder="e.g. Senior React Developer"
                value={aiParams.jobTitle}
                onChange={(e) =>
                  setAiParams({ ...aiParams, jobTitle: e.target.value })
                }
              />
            </Field>
            <Field label="Experience Level">
              <select
                className="ed-input ed-select"
                value={aiParams.experienceLevel}
                onChange={(e) =>
                  setAiParams({ ...aiParams, experienceLevel: e.target.value })
                }
              >
                {["Junior", "Mid-level", "Senior", "Lead", "Executive"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Key Skills" hint="Comma-separated">
              <input
                className="ed-input"
                placeholder="e.g. React, TypeScript, Node.js"
                value={aiParams.keySkills}
                onChange={(e) =>
                  setAiParams({ ...aiParams, keySkills: e.target.value })
                }
              />
            </Field>
          </div>
          <button
            className={`ed-btn ed-btn--gold ${aiLoading ? "ed-btn--loading" : ""}`}
            onClick={handleAiGenerate}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <><span className="ed-spinner" /> Generating…</>
            ) : (
              "Generate Vacancy Content ✦"
            )}
          </button>
        </div>
      )}

      {/* Success toast */}
      {success && (
        <div className="ed-toast ed-toast--success">
          ✓ Vacancy posted successfully!
        </div>
      )}

      {error && (
        <div className="ed-toast ed-toast--error">⚠ {error}</div>
      )}

      <form className="ed-form" onSubmit={handleSubmit}>
        <div className="ed-form-grid ed-form-grid--2">
          <Field label="Job Title *">
            <input
              name="title"
              className="ed-input"
              placeholder="e.g. Frontend Developer"
              value={form.title}
              onChange={handleChange}
            />
          </Field>
          <Field label="Salary Range">
            <input
              name="salaryRange"
              className="ed-input"
              placeholder="e.g. $4,000 – $6,000 / month"
              value={form.salaryRange}
              onChange={handleChange}
            />
          </Field>
        </div>

        <Field label="Job Description">
          <textarea
            name="description"
            className="ed-input ed-textarea"
            placeholder="Describe the role, company culture, responsibilities…"
            value={form.description}
            onChange={handleChange}
            rows={5}
          />
        </Field>

        <Field label="Requirements">
          <textarea
            name="requirements"
            className="ed-input ed-textarea"
            placeholder="List the skills, qualifications, and experience required…"
            value={form.requirements}
            onChange={handleChange}
            rows={4}
          />
        </Field>

        <div className="ed-form-grid ed-form-grid--2">
          <Field label="Status">
            <select
              name="status"
              className="ed-input ed-select"
              value={form.status}
              onChange={handleChange}
            >
              <option value="OPEN">Open — visible to candidates</option>
              <option value="DRAFT">Draft — save for later</option>
              <option value="CLOSED">Closed</option>
            </select>
          </Field>
        </div>

        <div className="ed-form-actions">
          <button
            type="submit"
            className={`ed-btn ed-btn--gold ed-btn--lg ${loading ? "ed-btn--loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <><span className="ed-spinner" /> Posting…</>
            ) : (
              <>Post Vacancy →</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Applications
───────────────────────────────────────── */
function Applications({ applications, vacancies, onRefresh }) {
  const [filterVacancy, setFilterVacancy] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [updating, setUpdating] = useState(null);

  const filtered = applications.filter((a) => {
    const matchV = filterVacancy === "ALL" || String(a.vacancyId) === filterVacancy;
    const matchS = filterStatus === "ALL" || a.status === filterStatus;
    return matchV && matchS;
  });

  const handleStatus = async (appId, newStatus) => {
    setUpdating(appId);
    try {
      await apiFetch(
        `/applications/${appId}/status?status=${newStatus}`,
        { method: "PATCH" }
      );
      onRefresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const statuses = ["APPLIED", "SHORTLISTED", "INTERVIEWED", "OFFERED", "REJECTED"];

  return (
    <div className="ed-section">
      <div className="ed-section-header">
        <div>
          <div className="ed-section-eyebrow">Candidate Pipeline</div>
          <h2 className="ed-section-title">Applications</h2>
        </div>
        <div className="ed-count-pill">{filtered.length} total</div>
      </div>

      {/* Filters */}
      <div className="ed-toolbar ed-toolbar--wrap">
        <div className="ed-filter-group">
          <label className="ed-filter-label">Vacancy</label>
          <select
            className="ed-input ed-select ed-select--sm"
            value={filterVacancy}
            onChange={(e) => setFilterVacancy(e.target.value)}
          >
            <option value="ALL">All Vacancies</option>
            {vacancies.map((v) => (
              <option key={v.id} value={String(v.id)}>
                {v.title}
              </option>
            ))}
          </select>
        </div>
        <div className="ed-filter-group">
          <label className="ed-filter-label">Status</label>
          <div className="ed-filter-pills">
            {["ALL", ...statuses].map((s) => (
              <button
                key={s}
                className={`ed-filter-pill ${filterStatus === s ? "ed-filter-pill--active" : ""}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon="◉"
          title="No applications found"
          sub="Applications will appear here once candidates apply to your vacancies"
        />
      ) : (
        <div className="ed-app-cards">
          {filtered.map((a, i) => (
            <div
              className="ed-app-card"
              key={a.id}
              style={{ "--row-delay": `${i * 50}ms` }}
            >
              <div className="ed-app-card-left">
                <div className="ed-app-card-avatar">
                  {a.candidateName?.[0] || "?"}
                </div>
                <div className="ed-app-card-info">
                  <div className="ed-app-card-name">{a.candidateName}</div>
                  <div className="ed-app-card-vacancy">{a.vacancyTitle}</div>
                  {a.appliedAt && (
                    <div className="ed-app-card-date">
                      Applied {new Date(a.appliedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="ed-app-card-right">
                <Badge status={a.status} />
                <div className="ed-status-actions">
                  {statuses
                    .filter((s) => s !== a.status)
                    .slice(0, 3)
                    .map((s) => (
                      <button
                        key={s}
                        className="ed-status-btn"
                        disabled={updating === a.id}
                        onClick={() => handleStatus(a.id, s)}
                      >
                        {updating === a.id ? "…" : s.charAt(0) + s.slice(1).toLowerCase()}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Orders
───────────────────────────────────────── */
function Orders({ orders, onRefresh }) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title) { setError("Title is required."); return; }
    setLoading(true);
    setError("");
    try {
      await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ title: "", description: "" });
      setShowCreate(false);
      onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await apiFetch(`/orders/${id}/status?status=${status}`, {
        method: "PATCH",
      });
      onRefresh();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="ed-section">
      <div className="ed-section-header">
        <div>
          <div className="ed-section-eyebrow">Staffing Requests</div>
          <h2 className="ed-section-title">My Orders</h2>
        </div>
        <button
          className="ed-btn ed-btn--gold"
          onClick={() => setShowCreate(true)}
        >
          <span>+</span> Place Order
        </button>
      </div>

      {orders.length === 0 ? (
        <Empty
          icon="⬡"
          title="No orders yet"
          sub="Place a staffing order to request candidates from the agency"
          action="Place Order"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="ed-orders-grid">
          {orders.map((o, i) => (
            <div
              className="ed-order-card"
              key={o.id}
              style={{ "--row-delay": `${i * 60}ms` }}
            >
              <div className="ed-order-card-top">
                <div className="ed-order-card-title">{o.title}</div>
                <Badge status={o.status} />
              </div>
              {o.description && (
                <div className="ed-order-card-desc">
                  {o.description.slice(0, 120)}
                  {o.description.length > 120 ? "…" : ""}
                </div>
              )}
              {o.shortlistedCandidates?.length > 0 && (
                <div className="ed-order-shortlist">
                  <span className="ed-order-shortlist-label">
                    Shortlisted:
                  </span>
                  {o.shortlistedCandidates.map((id) => (
                    <span key={id} className="ed-shortlist-chip">
                      #{id}
                    </span>
                  ))}
                </div>
              )}
              <div className="ed-order-card-footer">
                <span className="ed-order-date">
                  {o.createdAt
                    ? new Date(o.createdAt).toLocaleDateString()
                    : "—"}
                </span>
                {o.status === "PENDING" && (
                  <div className="ed-action-row">
                    <button
                      className="ed-status-btn"
                      onClick={() => handleStatusUpdate(o.id, "IN_PROGRESS")}
                    >
                      Mark In Progress
                    </button>
                    <button
                      className="ed-status-btn ed-status-btn--danger"
                      onClick={() => handleStatusUpdate(o.id, "CANCELLED")}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Order Modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setError(""); }}
        title="Place Staffing Order"
        width={500}
      >
        {error && (
          <div className="ed-toast ed-toast--error" style={{ marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}
        <form onSubmit={handleCreate}>
          <Field label="Order Title *">
            <input
              className="ed-input"
              placeholder="e.g. 5 Java Developers for Q1 project"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Description" hint="Optional — add any specific requirements">
            <textarea
              className="ed-input ed-textarea"
              placeholder="Describe the staffing need in detail…"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
              style={{ marginTop: 8 }}
            />
          </Field>
          <div className="ed-modal-actions" style={{ marginTop: 24 }}>
            <button
              type="button"
              className="ed-btn ed-btn--ghost"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`ed-btn ed-btn--gold ${loading ? "ed-btn--loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <><span className="ed-spinner" /> Placing…</>
              ) : (
                "Place Order"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Profile
───────────────────────────────────────── */
function Profile({ employer, onRefresh }) {
  const [form, setForm] = useState({
    companyName: employer?.companyName || "",
    industry: employer?.industry || "",
    website: employer?.website || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (employer) {
      setForm({
        companyName: employer.companyName || "",
        industry: employer.industry || "",
        website: employer.website || "",
      });
    }
  }, [employer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/employers/${employer.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setSuccess(true);
      onRefresh();
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ed-section">
      <div className="ed-section-header">
        <div>
          <div className="ed-section-eyebrow">Account Settings</div>
          <h2 className="ed-section-title">Company Profile</h2>
        </div>
      </div>

      <div className="ed-profile-grid">
        {/* Profile card */}
        <div className="ed-profile-card">
          <div className="ed-profile-avatar">
            {employer?.companyName?.[0] || "E"}
          </div>
          <div className="ed-profile-name">{employer?.companyName}</div>
          <div className="ed-profile-email">{employer?.email}</div>
          {employer?.industry && (
            <span className="ed-industry-tag">{employer.industry}</span>
          )}
          {employer?.website && (
            <a
              href={employer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="ed-profile-link"
            >
              {employer.website}
            </a>
          )}
          <div className="ed-profile-role-badge">
            <span className="ed-role-indicator" /> Employer
          </div>
        </div>

        {/* Edit form */}
        <div className="ed-profile-form-wrap">
          {success && (
            <div className="ed-toast ed-toast--success">
              ✓ Profile updated successfully!
            </div>
          )}
          {error && (
            <div className="ed-toast ed-toast--error">⚠ {error}</div>
          )}
          <form className="ed-form" onSubmit={handleSubmit}>
            <div className="ed-form-grid ed-form-grid--2">
              <Field label="Company Name *">
                <input
                  className="ed-input"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                  placeholder="Your company name"
                />
              </Field>
              <Field label="Industry">
                <input
                  className="ed-input"
                  value={form.industry}
                  onChange={(e) =>
                    setForm({ ...form, industry: e.target.value })
                  }
                  placeholder="e.g. Technology, Finance"
                />
              </Field>
            </div>
            <Field label="Website">
              <input
                className="ed-input"
                value={form.website}
                onChange={(e) =>
                  setForm({ ...form, website: e.target.value })
                }
                placeholder="https://yourcompany.com"
              />
            </Field>
            <div className="ed-form-actions">
              <button
                type="submit"
                className={`ed-btn ed-btn--gold ${loading ? "ed-btn--loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <><span className="ed-spinner" /> Saving…</>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────── */
export default function EmployerDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [activeSectionData, setActiveSectionData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [employer, setEmployer] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [orders, setOrders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  /* ── Initial data load ── */
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Load employer profile - handle 404 gracefully for new users
      let emp = null;
      try {
        emp = await apiFetch("/employers/me");
        setEmployer(emp);
      } catch (e) {
        if (!e.message.includes("404") && !e.message.includes("not found")) {
          throw e;
        }
        // If 404, we just keep employer as null so they can create a profile
      }

      // Load vacancies, orders, applications in parallel
      const [vacs, ords] = await Promise.all([
        apiFetch("/vacancies/my").catch(() => []),
        apiFetch("/orders/my").catch(() => []),
      ]);
      setVacancies(vacs || []);
      setOrders(ords || []);

      // Load applications for each vacancy
      if (vacs && vacs.length > 0) {
        const appArrays = await Promise.all(
          vacs.map((v) =>
            apiFetch(`/applications/vacancy/${v.id}`).catch(() => [])
          )
        );
        setApplications(appArrays.flat());
      }
    } catch (e) {
      setInitError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (section, data = null) => {
    if (section === "ai-tools") {
      navigate("/ai/tools");
      return;
    }
    setActiveSection(section);
    setActiveSectionData(data);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div className="ed-loading-screen">
        <div className="ed-loading-brand">
          <span className="ed-loading-icon">⬡</span>
          <span className="ed-loading-text">IntelliRecruit</span>
        </div>
        <div className="ed-loading-bar">
          <div className="ed-loading-fill" />
        </div>
        <div className="ed-loading-label">Loading your workspace…</div>
      </div>
    );
  }

  /* ── Error screen ── */
  if (initError) {
    return (
      <div className="ed-error-screen">
        <div className="ed-error-icon">⚠</div>
        <div className="ed-error-title">Failed to load dashboard</div>
        <div className="ed-error-sub">{initError}</div>
        <button className="ed-btn ed-btn--gold" onClick={loadAll}>
          Retry
        </button>
      </div>
    );
  }

  const navItems = [
    { id: "overview",     icon: <LayoutDashboard size={20} />, label: "Overview" },
    { id: "vacancies",    icon: <Briefcase size={20} />, label: "Vacancies",    badge: vacancies.filter(v => v.status === "OPEN").length },
    { id: "post-vacancy", icon: <PlusSquare size={20} />, label: "Post Vacancy" },
    { id: "applications", icon: <Users size={20} />, label: "Applications", badge: applications.filter(a => a.status === "APPLIED").length },
    { id: "orders",       icon: <ClipboardList size={20} />, label: "Orders",       badge: orders.filter(o => o.status === "PENDING").length },
    { id: "profile",      icon: <Settings size={20} />, label: "Profile" },
    { id: "ai-tools",     icon: <Sparkles size={20} />, label: "AI Tools" },
  ];

  return (
    <div className="ed-root">
      {/* Clean monochrome background */}

      {/* ── Mobile top bar ── */}
      <div className="ed-topbar">
        <button
          className="ed-topbar-hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span /><span /><span />
        </button>
        <div className="ed-topbar-brand">
          <span className="ed-brand-icon">⬡</span>
          <span className="ed-brand-text">IntelliRecruit</span>
        </div>
        <div className="ed-topbar-avatar">
          {employer?.companyName?.[0] || user?.name?.[0] || "E"}
        </div>
      </div>

      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="ed-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`ed-sidebar ${sidebarOpen ? "ed-sidebar--open" : ""}`}>
        {/* Brand */}
        <div className="ed-sidebar-brand">
          <span className="ed-brand-icon">⬡</span>
          <span className="ed-brand-text">IntelliRecruit</span>
        </div>

        {/* Role badge */}
        <div className="ed-sidebar-role">
          <span className="ed-role-dot" />
          <span className="ed-role-text">Employer Portal</span>
        </div>

        {/* Company info */}
        {employer && (
          <div className="ed-sidebar-user">
            <div className="ed-sidebar-avatar">
              {employer.companyName?.[0] || "E"}
            </div>
            <div className="ed-sidebar-user-info">
              <div className="ed-sidebar-user-name">{employer.companyName}</div>
              <div className="ed-sidebar-user-email">{employer.email}</div>
            </div>
          </div>
        )}

        <div className="ed-sidebar-divider" />

        {/* Nav */}
        <nav className="ed-sidebar-nav">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeSection === item.id}
              onClick={() => handleNavigate(item.id)}
              badge={item.badge}
            />
          ))}
        </nav>

        <div className="ed-sidebar-divider" />

        {/* Logout */}
        <button className="ed-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          Sign Out
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="ed-main">
        {activeSection === "overview" && (
          <Overview
            employer={employer}
            vacancies={vacancies}
            orders={orders}
            applications={applications}
            onNavigate={handleNavigate}
          />
        )}
        {activeSection === "vacancies" && (
          <Vacancies
            vacancies={vacancies}
            onRefresh={loadAll}
            onNavigate={handleNavigate}
          />
        )}
        {activeSection === "post-vacancy" && (
          <PostVacancy
            employer={employer}
            onSuccess={() => {
              loadAll();
              handleNavigate("vacancies");
            }}
          />
        )}
        {activeSection === "applications" && (
          <Applications
            applications={applications}
            vacancies={vacancies}
            onRefresh={loadAll}
          />
        )}
        {activeSection === "orders" && (
          <Orders orders={orders} onRefresh={loadAll} />
        )}
        {activeSection === "profile" && (
          <Profile employer={employer} onRefresh={loadAll} />
        )}
      </main>
    </div>
  );
}