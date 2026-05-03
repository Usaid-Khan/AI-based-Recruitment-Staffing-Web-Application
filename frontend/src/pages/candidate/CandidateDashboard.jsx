import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import "./CandidateDashboard.css";
import api from "../../services/api";
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Briefcase, 
  User, 
  UserCheck,
  LogOut, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  TrendingUp,
  Clock,
  Building,
  DollarSign,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  X
} from "lucide-react";

/* ─────────────────────────────────────────
   API Helpers
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

/* ─────────────────────────────────────────
   useCountUp hook
───────────────────────────────────────── */
function useCountUp(target, duration = 1600, trigger = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger || !target) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [trigger, target, duration]);
  return val;
}

/* ─────────────────────────────────────────
   Shared Sub-components
───────────────────────────────────────── */

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      className={`cd-nav-item ${active ? "cd-nav-item--active" : ""}`}
      onClick={onClick}
    >
      <span className="cd-nav-icon">{icon}</span>
      <span className="cd-nav-label">{label}</span>
      {badge > 0 && <span className="cd-nav-badge">{badge}</span>}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    APPLIED:     { label: "Applied",     cls: "cd-badge--applied" },
    SHORTLISTED: { label: "Shortlisted", cls: "cd-badge--shortlisted" },
    INTERVIEWED: { label: "Interviewed", cls: "cd-badge--interviewed" },
    OFFERED:     { label: "Offered",     cls: "cd-badge--offered" },
    REJECTED:    { label: "Rejected",    cls: "cd-badge--rejected" },
    WITHDRAWN:   { label: "Withdrawn",   cls: "cd-badge--withdrawn" },
    OPEN:        { label: "Open",        cls: "cd-badge--open" },
    CLOSED:      { label: "Closed",      cls: "cd-badge--closed" },
    DRAFT:       { label: "Draft",       cls: "cd-badge--draft" },
  };
  const { label, cls } = map[status] || { label: status, cls: "" };
  return <span className={`cd-badge ${cls}`}>{label}</span>;
}

function Empty({ icon, title, sub, action, onAction }) {
  return (
    <div className="cd-empty">
      <div className="cd-empty-icon">{icon}</div>
      <div className="cd-empty-title">{title}</div>
      <div className="cd-empty-sub">{sub}</div>
      {action && (
        <button className="cd-btn cd-btn--teal" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

function Modal({ open, onClose, title, children, width = 540 }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="cd-modal-overlay" onClick={onClose}>
      <div
        className="cd-modal"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cd-modal-header">
          <h3 className="cd-modal-title">{title}</h3>
          <button className="cd-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cd-modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="cd-field">
      <label className="cd-field-label">{label}</label>
      {children}
      {hint && <span className="cd-field-hint">{hint}</span>}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, delay, trigger }) {
  const count = useCountUp(typeof value === "number" ? value : 0, 1500, trigger);
  return (
    <div className="cd-stat-card" style={{ "--delay": delay, "--accent": color }}>
      <div className="cd-stat-icon">{icon}</div>
      <div className="cd-stat-body">
        <div className="cd-stat-value">
          {typeof value === "number" ? count : value}
        </div>
        <div className="cd-stat-label">{label}</div>
        {sub && <div className="cd-stat-sub">{sub}</div>}
      </div>
      <div className="cd-stat-glow" />
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Overview
───────────────────────────────────────── */
function Overview({ candidate, applications, placements, onNavigate }) {
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

  const totalApps    = applications.length;
  const shortlisted  = applications.filter((a) => a.status === "SHORTLISTED").length;
  const offered      = applications.filter((a) => a.status === "OFFERED").length;
  const totalPlaced  = placements.length;

  const recentApps = [...applications].sort((a, b) => b.id - a.id).slice(0, 5);

  /* profile completion */
  const fields = [
    !!candidate?.bio,
    !!candidate?.skills,
    candidate?.experienceYears != null,
    !!candidate?.resumeUrl,
    !!candidate?.isAvailable,
  ];
  const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  return (
    <div className="cd-section">
      {/* Welcome hero */}
      <div className="cd-welcome">
        <div className="cd-welcome-left">
          <div className="cd-welcome-eyebrow">Candidate Dashboard</div>
          <h1 className="cd-welcome-title">
            Hello, <em>{candidate?.name || "there"}</em>
          </h1>
          <p className="cd-welcome-sub">
            {candidate?.isAvailable ? (
              <span className="cd-avail-tag cd-avail-tag--yes">
                <span className="cd-avail-dot" /> Available for opportunities
              </span>
            ) : (
              <span className="cd-avail-tag cd-avail-tag--no">
                <span className="cd-avail-dot cd-avail-dot--no" /> Not available
              </span>
            )}
          </p>
        </div>
        <div className="cd-welcome-actions">
          <button
            className="cd-btn cd-btn--ghost"
            onClick={() => onNavigate("browse")}
          >
            Browse Jobs
          </button>
          <button
            className="cd-btn cd-btn--teal"
            onClick={() => onNavigate("profile")}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile completion bar */}
      {completion < 100 && (
        <div className="cd-completion-banner">
          <div className="cd-completion-left">
            <span className="cd-completion-label">Profile Completion</span>
            <span className="cd-completion-pct">{completion}%</span>
          </div>
          <div className="cd-completion-bar-wrap">
            <div
              className="cd-completion-bar-fill"
              style={{ width: `${completion}%` }}
            />
          </div>
          <button
            className="cd-btn cd-btn--ghost cd-btn--sm"
            onClick={() => onNavigate("profile")}
          >
            Complete →
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="cd-stats-grid" ref={statsRef}>
        <StatCard icon={<FileText size={22} />}     label="Total Applications" value={totalApps}   sub="Jobs applied to"     color="var(--c-teal)"  delay="0ms"   trigger={triggered} />
        <StatCard icon={<UserCheck size={22} />}    label="Shortlisted"        value={shortlisted} sub="By employers"        color="var(--c-gold)"  delay="80ms"  trigger={triggered} />
        <StatCard icon={<CheckCircle size={22} />}  label="Offers Received"    value={offered}     sub="Pending your review" color="#22c55e"        delay="160ms" trigger={triggered} />
        <StatCard icon={<Briefcase size={22} />}    label="Placements"         value={totalPlaced} sub="Successfully placed" color="#60a5fa"        delay="240ms" trigger={triggered} />
      </div>

      {/* Two-col layout */}
      <div className="cd-overview-grid">
        {/* Recent applications */}
        <div className="cd-overview-card">
          <div className="cd-card-header">
            <span className="cd-card-title">Recent Applications</span>
            <button className="cd-card-link" onClick={() => onNavigate("applications")}>
              View all →
            </button>
          </div>
          {recentApps.length === 0 ? (
            <Empty
              icon={<Search size={48} />}
              title="No applications yet"
              sub="Browse open vacancies and start applying"
              action="Browse Jobs"
              onAction={() => onNavigate("browse")}
            />
          ) : (
            <div className="cd-recent-apps">
              {recentApps.map((a) => (
                <div className="cd-recent-app-row" key={a.id}>
                  <div className="cd-recent-app-avatar">
                    {a.vacancyTitle?.[0] || "J"}
                  </div>
                  <div className="cd-recent-app-info">
                    <div className="cd-recent-app-title">{a.vacancyTitle}</div>
                    {a.appliedAt && (
                      <div className="cd-recent-app-date">
                        Applied {new Date(a.appliedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile snapshot */}
        <div className="cd-overview-card">
          <div className="cd-card-header">
            <span className="cd-card-title">Your Profile</span>
            <button className="cd-card-link" onClick={() => onNavigate("profile")}>
              Edit →
            </button>
          </div>
          <div className="cd-profile-snapshot">
            <div className="cd-snapshot-avatar">
              {candidate?.name?.[0] || "C"}
            </div>
            <div className="cd-snapshot-name">{candidate?.name}</div>
            <div className="cd-snapshot-email">{candidate?.email}</div>

            {candidate?.experienceYears != null && (
              <div className="cd-snapshot-detail">
                <TrendingUp size={14} style={{ marginRight: 8 }} />
                {candidate.experienceYears} year{candidate.experienceYears !== 1 ? "s" : ""} experience
              </div>
            )}

            {candidate?.skills && (
              <div className="cd-snapshot-skills">
                {candidate.skills
                  .split(",")
                  .slice(0, 5)
                  .map((s) => (
                    <span key={s} className="cd-skill-chip">
                      {s.trim()}
                    </span>
                  ))}
              </div>
            )}

            {candidate?.resumeUrl ? (
              <a
                href={candidate.resumeUrl}
                className="cd-resume-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText size={14} style={{ marginRight: 8 }} />
                View Resume
              </a>
            ) : (
              <button
                className="cd-btn cd-btn--ghost cd-btn--sm"
                onClick={() => onNavigate("profile")}
              >
                Upload Resume
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Browse Vacancies
───────────────────────────────────────── */
function BrowseVacancies({ candidateId, applications, onRefresh }) {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applying, setApplying] = useState(null);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState(null);

  useEffect(() => {
    apiFetch("/vacancies")
      .then(setVacancies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const appliedIds = new Set(applications.map((a) => a.vacancyId));

  const filtered = vacancies.filter(
    (v) =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.requirements || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleApply = async (vacancyId) => {
    setApplying(vacancyId);
    setError("");
    try {
      await apiFetch(`/applications/vacancy/${vacancyId}`, { method: "POST" });
      setSuccessId(vacancyId);
      onRefresh();
      setTimeout(() => setSuccessId(null), 3000);
      setSelectedVacancy(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="cd-section">
      <div className="cd-section-header">
        <div>
          <div className="cd-section-eyebrow">Opportunities</div>
          <h2 className="cd-section-title">Browse Vacancies</h2>
        </div>
        <div className="cd-count-pill">{filtered.length} open roles</div>
      </div>

      {/* Search */}
      <div className="cd-search-bar">
        <span className="cd-search-icon">
          <Search size={18} />
        </span>
        <input
          className="cd-search-input"
          placeholder="Search by title, skills, or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="cd-search-clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {error && <div className="cd-toast cd-toast--error">⚠ {error}</div>}
      {successId && (
        <div className="cd-toast cd-toast--success">
          <CheckCircle size={16} /> Application submitted successfully!
        </div>
      )}

      {loading ? (
        <div className="cd-loading-rows">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="cd-skeleton-row" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          icon={<Search size={48} />}
          title="No vacancies found"
          sub={search ? "Try a different keyword" : "No open vacancies at the moment"}
        />
      ) : (
        <div className="cd-vacancy-cards">
          {filtered.map((v, i) => {
            const hasApplied = appliedIds.has(v.id);
            return (
              <div
                className={`cd-vacancy-card ${hasApplied ? "cd-vacancy-card--applied" : ""}`}
                key={v.id}
                style={{ "--row-delay": `${i * 45}ms` }}
              >
                <div className="cd-vacancy-card-top">
                  <div className="cd-vacancy-logo">
                    {v.companyName?.[0] || "C"}
                  </div>
                  <div className="cd-vacancy-card-meta">
                    <div className="cd-vacancy-card-title">{v.title}</div>
                    <div className="cd-vacancy-card-company">{v.companyName}</div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>

                {v.description && (
                  <p className="cd-vacancy-card-desc">
                    {v.description.replace(/[#*`_~]/g, "").trim().slice(0, 160)}
                    {v.description.length > 160 ? "…" : ""}
                  </p>
                )}

                <div className="cd-vacancy-card-footer">
                  <div className="cd-vacancy-pills">
                    {v.salaryRange && (
                      <span className="cd-vacancy-pill cd-vacancy-pill--salary">
                        <DollarSign size={14} /> {v.salaryRange}
                      </span>
                    )}
                  </div>
                  <div className="cd-vacancy-actions">
                    <button
                      className="cd-btn cd-btn--ghost cd-btn--sm"
                      onClick={() => setSelectedVacancy(v)}
                    >
                      Details
                    </button>
                    {hasApplied ? (
                      <span className="cd-applied-tag">✓ Applied</span>
                    ) : (
                      <button
                        className={`cd-btn cd-btn--teal cd-btn--sm ${applying === v.id ? "cd-btn--loading" : ""}`}
                        onClick={() => handleApply(v.id)}
                        disabled={applying === v.id}
                      >
                        {applying === v.id ? (
                          <><span className="cd-spinner" /> Applying…</>
                        ) : (
                          "Apply Now"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vacancy detail modal */}
      <Modal
        open={!!selectedVacancy}
        onClose={() => setSelectedVacancy(null)}
        title={selectedVacancy?.title || ""}
        width={620}
      >
        {selectedVacancy && (
          <div className="cd-vacancy-detail">
            <div className="cd-detail-company">
              <div className="cd-detail-logo">
                {selectedVacancy.companyName?.[0] || "C"}
              </div>
              <div>
                <div className="cd-detail-company-name">
                  {selectedVacancy.companyName}
                </div>
                {selectedVacancy.salaryRange && (
                  <div className="cd-detail-salary">
                    {selectedVacancy.salaryRange}
                  </div>
                )}
              </div>
              <StatusBadge status={selectedVacancy.status} />
            </div>

            {selectedVacancy.description && (
              <div className="cd-detail-block">
                <div className="cd-detail-block-title">About the Role</div>
                <div className="markdown-content">
                  <ReactMarkdown>{selectedVacancy.description}</ReactMarkdown>
                </div>
              </div>
            )}

            {selectedVacancy.requirements && (
              <div className="cd-detail-block">
                <div className="cd-detail-block-title">Requirements</div>
                <div className="markdown-content">
                  <ReactMarkdown>{selectedVacancy.requirements}</ReactMarkdown>
                </div>
              </div>
            )}

            <div className="cd-modal-actions">
              <button
                className="cd-btn cd-btn--ghost"
                onClick={() => setSelectedVacancy(null)}
              >
                Close
              </button>
              {appliedIds.has(selectedVacancy.id) ? (
                <span className="cd-applied-tag">✓ Already Applied</span>
              ) : (
                <button
                  className={`cd-btn cd-btn--teal ${applying === selectedVacancy.id ? "cd-btn--loading" : ""}`}
                  onClick={() => handleApply(selectedVacancy.id)}
                  disabled={applying === selectedVacancy.id}
                >
                  {applying === selectedVacancy.id ? (
                    <><span className="cd-spinner" /> Applying…</>
                  ) : (
                    "Apply for this Role"
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: My Applications
───────────────────────────────────────── */
function MyApplications({ applications, onRefresh }) {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [withdrawId, setWithdrawId] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const statuses = ["APPLIED", "SHORTLISTED", "INTERVIEWED", "OFFERED", "REJECTED", "WITHDRAWN"];

  const filtered = applications.filter(
    (a) => filterStatus === "ALL" || a.status === filterStatus
  );

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      await apiFetch(`/applications/${withdrawId}/withdraw`, { method: "PATCH" });
      onRefresh();
      setWithdrawId(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setWithdrawing(false);
    }
  };

  /* pipeline counts */
  const counts = {};
  statuses.forEach((s) => {
    counts[s] = applications.filter((a) => a.status === s).length;
  });

  return (
    <div className="cd-section">
      <div className="cd-section-header">
        <div>
          <div className="cd-section-eyebrow">Tracking</div>
          <h2 className="cd-section-title">My Applications</h2>
        </div>
        <div className="cd-count-pill">{applications.length} total</div>
      </div>

      {/* Pipeline mini-summary */}
      <div className="cd-pipeline-strip">
        {[
          { label: "Applied",     status: "APPLIED",     color: "#60a5fa" },
          { label: "Shortlisted", status: "SHORTLISTED", color: "var(--c-gold)" },
          { label: "Interviewed", status: "INTERVIEWED", color: "var(--c-teal)" },
          { label: "Offered",     status: "OFFERED",     color: "#22c55e" },
          { label: "Rejected",    status: "REJECTED",    color: "#ef4444" },
        ].map((p, i, arr) => (
          <div key={p.status} className="cd-pipeline-item">
            <div
              className="cd-pipeline-count"
              style={{ color: p.color }}
            >
              {counts[p.status] || 0}
            </div>
            <div className="cd-pipeline-label">{p.label}</div>
            {i < arr.length - 1 && (
              <div className="cd-pipeline-arrow">›</div>
            )}
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="cd-filter-bar">
        {["ALL", ...statuses].map((s) => (
          <button
            key={s}
            className={`cd-filter-pill ${filterStatus === s ? "cd-filter-pill--active" : ""}`}
            onClick={() => setFilterStatus(s)}
          >
            {s === "ALL"
              ? `All (${applications.length})`
              : `${s.charAt(0) + s.slice(1).toLowerCase()} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon="◉"
          title="No applications here"
          sub="Try a different status filter or apply to more vacancies"
        />
      ) : (
        <div className="cd-app-timeline">
          {filtered.map((a, i) => (
            <div
              className="cd-app-timeline-item"
              key={a.id}
              style={{ "--row-delay": `${i * 50}ms` }}
            >
              {/* Timeline dot */}
              <div className="cd-timeline-dot-wrap">
                <div className="cd-timeline-dot" />
                {i < filtered.length - 1 && (
                  <div className="cd-timeline-line" />
                )}
              </div>

              {/* Card */}
              <div className="cd-app-timeline-card">
                <div className="cd-app-timeline-top">
                  <div className="cd-app-timeline-info">
                    <div className="cd-app-timeline-title">
                      {a.vacancyTitle}
                    </div>
                    {a.appliedAt && (
                      <div className="cd-app-timeline-date">
                        Applied on{" "}
                        {new Date(a.appliedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                  <div className="cd-app-timeline-right">
                    <StatusBadge status={a.status} />
                    {(a.status === "APPLIED" || a.status === "SHORTLISTED") && (
                      <button
                        className="cd-icon-btn cd-icon-btn--red"
                        title="Withdraw application"
                        onClick={() => setWithdrawId(a.id)}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status progress bar */}
                <div className="cd-app-progress">
                  {["APPLIED", "SHORTLISTED", "INTERVIEWED", "OFFERED"].map(
                    (s, idx) => {
                      const order = ["APPLIED", "SHORTLISTED", "INTERVIEWED", "OFFERED", "REJECTED", "WITHDRAWN"];
                      const currentIdx = order.indexOf(a.status);
                      const isActive = idx <= currentIdx && currentIdx < 4;
                      const isCurrent = s === a.status;
                      return (
                        <div key={s} className="cd-app-progress-step">
                          <div
                            className={`cd-app-progress-dot ${isActive ? "cd-app-progress-dot--active" : ""} ${isCurrent ? "cd-app-progress-dot--current" : ""}`}
                          />
                          <div className="cd-app-progress-label">{s.charAt(0) + s.slice(1).toLowerCase()}</div>
                          {idx < 3 && (
                            <div className={`cd-app-progress-line ${isActive && idx < currentIdx ? "cd-app-progress-line--active" : ""}`} />
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Withdraw confirm modal */}
      <Modal
        open={!!withdrawId}
        onClose={() => setWithdrawId(null)}
        title="Withdraw Application"
        width={400}
      >
        <p className="cd-modal-text">
          Are you sure you want to withdraw this application? You may not be
          able to re-apply to the same vacancy.
        </p>
        <div className="cd-modal-actions">
          <button
            className="cd-btn cd-btn--ghost"
            onClick={() => setWithdrawId(null)}
          >
            Cancel
          </button>
          <button
            className="cd-btn cd-btn--danger"
            onClick={handleWithdraw}
            disabled={withdrawing}
          >
            {withdrawing ? "Withdrawing…" : "Withdraw Application"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Placements
───────────────────────────────────────── */
function Placements({ placements }) {
  return (
    <div className="cd-section">
      <div className="cd-section-header">
        <div>
          <div className="cd-section-eyebrow">Career History</div>
          <h2 className="cd-section-title">My Placements</h2>
        </div>
        <div className="cd-count-pill">{placements.length} placement{placements.length !== 1 ? "s" : ""}</div>
      </div>

      {placements.length === 0 ? (
        <Empty
          icon="⬡"
          title="No placements yet"
          sub="Your confirmed job placements will appear here once an admin places you"
        />
      ) : (
        <div className="cd-placements-list">
          {placements.map((p, i) => (
            <div
              className="cd-placement-card"
              key={p.id}
              style={{ "--row-delay": `${i * 60}ms` }}
            >
              <div className="cd-placement-top">
                <div className="cd-placement-logo">
                  {p.companyName?.[0] || "C"}
                </div>
                <div className="cd-placement-info">
                  <div className="cd-placement-title">
                    {p.vacancyTitle || "Placement"}
                  </div>
                  <div className="cd-placement-company">{p.companyName}</div>
                  {p.startDate && (
                    <div className="cd-placement-date">
                      Started{" "}
                      {new Date(p.startDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  )}
                </div>
                <div className="cd-placement-badge">Placed ✓</div>
              </div>

              {p.contractUrl && (
                <div className="cd-placement-footer">
                  <a
                    href={p.contractUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cd-btn cd-btn--ghost cd-btn--sm"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <rect x="1.5" y="0.5" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M3 3.5h4M3 5.5h4M3 7.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    View Contract
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Profile
───────────────────────────────────────── */
function Profile({ candidate, onRefresh }) {
  const [form, setForm] = useState({
    bio: candidate?.bio || "",
    skills: candidate?.skills || "",
    experienceYears: candidate?.experienceYears ?? "",
    isAvailable: candidate?.isAvailable ?? true,
  });
  const [loading, setLoading]       = useState(false);
  const [aiLoading, setAiLoading]   = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (candidate) {
      setForm({
        bio: candidate.bio || "",
        skills: candidate.skills || "",
        experienceYears: candidate.experienceYears ?? "",
        isAvailable: candidate.isAvailable ?? true,
      });
    }
  }, [candidate]);

  const handleChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleAiGenerateBio = async () => {
    setAiLoading(true);
    setError("");
    try {
      const data = await apiFetch(
        `/ai/candidates/${candidate.id}/generate-bio`,
        { method: "POST" }
      );
      setForm((f) => ({ ...f, bio: data.content }));
    } catch (e) {
      setError("AI bio generation failed: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/candidates/${candidate.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          experienceYears: form.experienceYears !== "" ? Number(form.experienceYears) : null,
        }),
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

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${BASE}/candidates/${candidate.id}/resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      onRefresh();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const skills = form.skills
    ? form.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="cd-section">
      <div className="cd-section-header">
        <div>
          <div className="cd-section-eyebrow">Account Settings</div>
          <h2 className="cd-section-title">My Profile</h2>
        </div>
      </div>

      <div className="cd-profile-layout">
        {/* Left column — identity card */}
        <div className="cd-identity-card">
          <div className="cd-identity-avatar">
            {candidate?.name?.[0] || "C"}
          </div>
          <div className="cd-identity-name">{candidate?.name}</div>
          <div className="cd-identity-email">{candidate?.email}</div>

          {/* Availability toggle */}
          <label className="cd-avail-toggle">
            <input
              type="checkbox"
              name="isAvailable"
              checked={form.isAvailable}
              onChange={handleChange}
              className="cd-toggle-input"
            />
            <span className="cd-toggle-track">
              <span className="cd-toggle-thumb" />
            </span>
            <span className="cd-toggle-label">
              {form.isAvailable ? "Available" : "Not Available"}
            </span>
          </label>

          {/* Resume upload */}
          <div className="cd-resume-section">
            <div className="cd-resume-label">Resume / CV</div>
            {candidate?.resumeUrl ? (
              <a
                href={candidate.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cd-resume-view-btn"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="1" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M4 4h4M4 6.5h4M4 9h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                View Resume
              </a>
            ) : (
              <div className="cd-resume-empty">No resume uploaded</div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleUpload}
              className="cd-file-input"
            />
            <button
              className={`cd-btn cd-btn--ghost cd-btn--sm ${uploadLoading ? "cd-btn--loading" : ""}`}
              onClick={() => fileRef.current?.click()}
              disabled={uploadLoading}
              style={{ marginTop: 8 }}
            >
              {uploadLoading ? (
                <><span className="cd-spinner cd-spinner--dark" /> Uploading…</>
              ) : (
                candidate?.resumeUrl ? "Replace Resume" : "Upload Resume"
              )}
            </button>
          </div>

          {/* Skills preview */}
          {skills.length > 0 && (
            <div className="cd-skills-preview">
              <div className="cd-skills-preview-label">Skills</div>
              <div className="cd-skills-preview-chips">
                {skills.slice(0, 8).map((s) => (
                  <span key={s} className="cd-skill-chip">{s}</span>
                ))}
                {skills.length > 8 && (
                  <span className="cd-skill-chip cd-skill-chip--more">
                    +{skills.length - 8}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column — edit form */}
        <div className="cd-edit-form-wrap">
          {success && (
            <div className="cd-toast cd-toast--success">
              ✓ Profile updated successfully!
            </div>
          )}
          {error && (
            <div className="cd-toast cd-toast--error">⚠ {error}</div>
          )}

          <form className="cd-form" onSubmit={handleSave}>
            {/* Bio with AI generator */}
            <div className="cd-bio-block">
              <div className="cd-bio-header">
                <label className="cd-field-label">Professional Bio</label>
                <button
                  type="button"
                  className={`cd-ai-gen-btn ${aiLoading ? "cd-ai-gen-btn--loading" : ""}`}
                  onClick={handleAiGenerateBio}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <><span className="cd-spinner cd-spinner--teal" /> Generating…</>
                  ) : (
                    <>✦ Generate with AI</>
                  )}
                </button>
              </div>
              <textarea
                name="bio"
                className="cd-input cd-textarea"
                placeholder="Write a professional summary about yourself, your experience, and what you bring to the table…"
                value={form.bio}
                onChange={handleChange}
                rows={6}
              />
              <span className="cd-field-hint">
                Tip: Use the AI generator to create a polished bio instantly.
              </span>
            </div>

            <div className="cd-form-grid cd-form-grid--2">
              <Field
                label="Years of Experience"
                hint="Total professional experience"
              >
                <input
                  name="experienceYears"
                  type="number"
                  min="0"
                  max="50"
                  className="cd-input"
                  placeholder="e.g. 3"
                  value={form.experienceYears}
                  onChange={handleChange}
                />
              </Field>
            </div>

            <Field
              label="Skills"
              hint="Comma-separated — e.g. React, Java, Spring Boot, PostgreSQL"
            >
              <input
                name="skills"
                className="cd-input"
                placeholder="React, Node.js, Java, Python…"
                value={form.skills}
                onChange={handleChange}
              />
              {/* Live skill chips preview */}
              {skills.length > 0 && (
                <div className="cd-skills-live-preview">
                  {skills.map((s) => (
                    <span key={s} className="cd-skill-chip">{s}</span>
                  ))}
                </div>
              )}
            </Field>

            <div className="cd-form-actions">
              <button
                type="submit"
                className={`cd-btn cd-btn--teal cd-btn--lg ${loading ? "cd-btn--loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <><span className="cd-spinner" /> Saving…</>
                ) : (
                  "Save Profile"
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
export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen]     = useState(false);

  const [candidate,    setCandidate]    = useState(null);
  const [applications, setApplications] = useState([]);
  const [placements,   setPlacements]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [initError,    setInitError]    = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const cand = await apiFetch("/candidates/me");
      setCandidate(cand);
      const [apps, placed] = await Promise.all([
        apiFetch("/applications/my"),
        apiFetch(`/placements/candidate/${cand.id}`).catch(() => []),
      ]);
      setApplications(apps || []);
      setPlacements(placed || []);
    } catch (e) {
      setInitError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="cd-loading-screen">
        <div className="cd-loading-brand">
          <span className="cd-loading-icon">⬡</span>
          <span className="cd-loading-text">IntelliRecruit</span>
        </div>
        <div className="cd-loading-bar">
          <div className="cd-loading-fill" />
        </div>
        <div className="cd-loading-label">Loading your dashboard…</div>
      </div>
    );
  }

  /* ── Error ── */
  if (initError) {
    return (
      <div className="cd-error-screen">
        <div className="cd-error-icon">⚠</div>
        <div className="cd-error-title">Could not load dashboard</div>
        <div className="cd-error-sub">{initError}</div>
        <button className="cd-btn cd-btn--teal" onClick={loadAll}>
          Retry
        </button>
      </div>
    );
  }

  const newApps = applications.filter((a) => a.status === "APPLIED").length;

  const navItems = [
    { id: "overview",      icon: <LayoutDashboard size={20} />, label: "Overview" },
    { id: "browse",        icon: <Search size={20} />, label: "Browse Jobs" },
    { id: "applications",  icon: <FileText size={20} />, label: "Applications", badge: newApps },
    { id: "placements",    icon: <Briefcase size={20} />, label: "Placements",   badge: placements.length },
    { id: "profile",       icon: <User size={20} />, label: "My Profile" },
  ];

  return (
    <div className="cd-root">
      {/* Ambient */}
      <div className="cd-ambient">
        <div className="cd-ambient-orb cd-ambient-orb--1" />
        <div className="cd-ambient-orb cd-ambient-orb--2" />
        <div className="cd-ambient-orb cd-ambient-orb--3" />
        <div className="cd-grid-overlay" />
      </div>

      {/* Mobile topbar */}
      <div className="cd-topbar">
        <button
          className="cd-topbar-hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
        <div className="cd-topbar-brand">
          <span className="cd-brand-icon">⬡</span>
          <span className="cd-brand-text">IntelliRecruit</span>
        </div>
        <div className="cd-topbar-avatar">
          {candidate?.name?.[0] || user?.name?.[0] || "C"}
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="cd-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`cd-sidebar ${sidebarOpen ? "cd-sidebar--open" : ""}`}>
        <div className="cd-sidebar-brand">
          <span className="cd-brand-icon">⬡</span>
          <span className="cd-brand-text">IntelliRecruit</span>
        </div>

        <div className="cd-sidebar-role">
          <span className="cd-role-dot" />
          <span className="cd-role-text">Candidate Portal</span>
        </div>

        {/* User card */}
        {candidate && (
          <div className="cd-sidebar-user">
            <div className="cd-sidebar-avatar">
              {candidate.name?.[0] || "C"}
            </div>
            <div className="cd-sidebar-user-info">
              <div className="cd-sidebar-user-name">{candidate.name}</div>
              <div className="cd-sidebar-user-email">{candidate.email}</div>
            </div>
          </div>
        )}

        {/* Profile completion mini */}
        {candidate && (
          <div className="cd-sidebar-completion">
            <div className="cd-sidebar-completion-row">
              <span className="cd-sidebar-completion-label">Profile</span>
              <span className="cd-sidebar-completion-pct">
                {Math.round(
                  ([!!candidate.bio, !!candidate.skills,
                    candidate.experienceYears != null,
                    !!candidate.resumeUrl].filter(Boolean).length / 4) * 100
                )}%
              </span>
            </div>
            <div className="cd-sidebar-completion-bar">
              <div
                className="cd-sidebar-completion-fill"
                style={{
                  width: `${Math.round(
                    ([!!candidate.bio, !!candidate.skills,
                      candidate.experienceYears != null,
                      !!candidate.resumeUrl].filter(Boolean).length / 4) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="cd-sidebar-divider" />

        <nav className="cd-sidebar-nav">
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

        <div className="cd-sidebar-divider" />

        {/* Availability quick-toggle */}
        <div className="cd-sidebar-avail">
          <span
            className={`cd-sidebar-avail-dot ${candidate?.isAvailable ? "cd-sidebar-avail-dot--yes" : "cd-sidebar-avail-dot--no"}`}
          />
          <span className="cd-sidebar-avail-text">
            {candidate?.isAvailable ? "Available" : "Not available"}
          </span>
        </div>

        <button className="cd-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          Sign Out
        </button>
      </aside>

      {/* Main */}
      <main className="cd-main">
        {activeSection === "overview" && (
          <Overview
            candidate={candidate}
            applications={applications}
            placements={placements}
            onNavigate={handleNavigate}
          />
        )}
        {activeSection === "browse" && (
          <BrowseVacancies
            candidateId={candidate?.id}
            applications={applications}
            onRefresh={loadAll}
          />
        )}
        {activeSection === "applications" && (
          <MyApplications
            applications={applications}
            onRefresh={loadAll}
          />
        )}
        {activeSection === "placements" && (
          <Placements placements={placements} />
        )}
        {activeSection === "profile" && (
          <Profile candidate={candidate} onRefresh={loadAll} />
        )}
      </main>
    </div>
  );
}