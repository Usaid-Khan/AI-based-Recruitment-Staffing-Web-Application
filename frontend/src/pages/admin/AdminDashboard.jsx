import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

/* ─────────────────────────────────────────
   API Helpers
───────────────────────────────────────── */
const BASE = "http://localhost:8080/api";
const token = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token()}`,
});
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers || {}) },
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.message || "Request failed");
  }
  return res.json();
}

/* ─────────────────────────────────────────
   useCountUp
───────────────────────────────────────── */
function useCountUp(target, duration = 1600, trigger = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger || !target) return;
    let s = null;
    const step = (ts) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [trigger, target, duration]);
  return val;
}

/* ─────────────────────────────────────────
   Shared UI primitives
───────────────────────────────────────── */
function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button className={`ad-nav-item ${active ? "ad-nav-item--active" : ""}`} onClick={onClick}>
      <span className="ad-nav-icon">{icon}</span>
      <span className="ad-nav-label">{label}</span>
      {badge > 0 && <span className="ad-nav-badge">{badge}</span>}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    OPEN: { label: "Open", cls: "adb--open" },
    CLOSED: { label: "Closed", cls: "adb--closed" },
    DRAFT: { label: "Draft", cls: "adb--draft" },
    PENDING: { label: "Pending", cls: "adb--pending" },
    IN_PROGRESS: { label: "In Progress", cls: "adb--progress" },
    FULFILLED: { label: "Fulfilled", cls: "adb--fulfilled" },
    CANCELLED: { label: "Cancelled", cls: "adb--cancelled" },
    APPLIED: { label: "Applied", cls: "adb--applied" },
    SHORTLISTED: { label: "Shortlisted", cls: "adb--shortlisted" },
    INTERVIEWED: { label: "Interviewed", cls: "adb--interviewed" },
    OFFERED: { label: "Offered", cls: "adb--offered" },
    REJECTED: { label: "Rejected", cls: "adb--rejected" },
    CANDIDATE: { label: "Candidate", cls: "adb--candidate" },
    EMPLOYER: { label: "Employer", cls: "adb--employer" },
    ADMIN: { label: "Admin", cls: "adb--admin" },
  };
  const { label, cls } = map[status] || { label: status, cls: "" };
  return <span className={`ad-badge ${cls}`}>{label}</span>;
}

function Empty({ icon, title, sub, action, onAction }) {
  return (
    <div className="ad-empty">
      <div className="ad-empty-icon">{icon}</div>
      <div className="ad-empty-title">{title}</div>
      <div className="ad-empty-sub">{sub}</div>
      {action && <button className="ad-btn ad-btn--gold" onClick={onAction}>{action}</button>}
    </div>
  );
}

function Modal({ open, onClose, title, children, width = 560 }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className="ad-modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="ad-modal-header">
          <h3 className="ad-modal-title">{title}</h3>
          <button className="ad-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="ad-modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="ad-field">
      <label className="ad-field-label">{label}</label>
      {children}
      {hint && <span className="ad-field-hint">{hint}</span>}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, delay, trigger }) {
  const count = useCountUp(typeof value === "number" ? value : 0, 1500, trigger);
  return (
    <div className="ad-stat-card" style={{ "--delay": delay, "--accent": color }}>
      <div className="ad-stat-icon">{icon}</div>
      <div className="ad-stat-body">
        <div className="ad-stat-value">{typeof value === "number" ? count : value}</div>
        <div className="ad-stat-label">{label}</div>
        {sub && <div className="ad-stat-sub">{sub}</div>}
      </div>
      <div className="ad-stat-glow" />
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className={`ad-toast-global ad-toast-global--${type}`}>
      {type === "success" ? "✓" : "⚠"} {msg}
      <button className="ad-toast-x" onClick={onClose}>✕</button>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Overview
───────────────────────────────────────── */
function Overview({ stats, onNavigate }) {
  const statsRef = useRef(null);
  const [triggered, setTriggered] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setTriggered(true), { threshold: 0.2 });
    if (statsRef.current) io.observe(statsRef.current);
    return () => io.disconnect();
  }, []);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const quickLinks = [
    { label: "Manage Users",       icon: "◈", section: "users",      desc: "View all candidates, employers and admins" },
    { label: "Manage Placements",  icon: "◉", section: "placements",  desc: "Create and manage candidate placements" },
    { label: "Manage Orders",      icon: "⬡", section: "orders",      desc: "Review and update staffing orders" },
    { label: "Manage Vacancies",   icon: "✦", section: "vacancies",   desc: "Oversee all job postings on the platform" },
    { label: "AI Tools",           icon: "✧", section: "ai-tools",    desc: "Generate contracts, emails, blogs & more" },
    { label: "Blog Manager",       icon: "◎", section: "blog",        desc: "Create and publish blog posts with AI" },
  ];

  return (
    <div className="ad-section">
      {/* Welcome */}
      <div className="ad-welcome">
        <div className="ad-welcome-left">
          <div className="ad-welcome-eyebrow">Administrator Dashboard</div>
          <h1 className="ad-welcome-title">
            Control Centre,{" "}
            <em>{user?.name || "Admin"}</em>
          </h1>
          <p className="ad-welcome-sub">
            Full platform oversight. Manage users, placements, orders, and AI-powered tools.
          </p>
        </div>
        <div className="ad-welcome-badge">
          <span className="ad-admin-icon">⚙️</span>
          <span className="ad-admin-role">Admin</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="ad-stats-grid" ref={statsRef}>
        <StatCard icon="◈" label="Total Candidates" value={stats.candidates} sub="Registered candidates"  color="var(--c-text)"  delay="0ms"   trigger={triggered} />
        <StatCard icon="⬡" label="Total Employers"  value={stats.employers}  sub="Active companies"       color="var(--c-text)"  delay="80ms"  trigger={triggered} />
        <StatCard icon="✦" label="Open Vacancies"   value={stats.vacancies}  sub="Live job postings"      color="var(--c-text)"  delay="160ms" trigger={triggered} />
        <StatCard icon="◉" label="Total Orders"     value={stats.orders}     sub="Staffing requests"      color="var(--c-text)"  delay="240ms" trigger={triggered} />
        <StatCard icon="◎" label="Placements"       value={stats.placements} sub="Successful placements"  color="var(--c-text)"  delay="320ms" trigger={triggered} />
        <StatCard icon="✧" label="Blog Posts"       value={stats.blogs}      sub="Published articles"     color="var(--c-text)"  delay="400ms" trigger={triggered} />
      </div>

      {/* Quick links */}
      <div className="ad-section-header" style={{ marginBottom: 20, marginTop: 8 }}>
        <div>
          <div className="ad-section-eyebrow">Quick Access</div>
          <h2 className="ad-section-title">Platform Modules</h2>
        </div>
      </div>

      <div className="ad-quick-grid">
        {quickLinks.map((ql, i) => (
          <button
            key={ql.section}
            className="ad-quick-card"
            onClick={() => onNavigate(ql.section)}
            style={{ "--ql-delay": `${i * 70}ms` }}
          >
            <div className="ad-quick-icon">{ql.icon}</div>
            <div className="ad-quick-label">{ql.label}</div>
            <div className="ad-quick-desc">{ql.desc}</div>
            <div className="ad-quick-arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Users
───────────────────────────────────────── */
function Users({ notify }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/users/${deleteId}`, { method: "DELETE" });
      notify("User deleted successfully", "success");
      setDeleteId(null);
      loadUsers();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = {
    ALL: users.length,
    CANDIDATE: users.filter((u) => u.role === "CANDIDATE").length,
    EMPLOYER: users.filter((u) => u.role === "EMPLOYER").length,
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
  };

  return (
    <div className="ad-section">
      <div className="ad-section-header">
        <div>
          <div className="ad-section-eyebrow">User Management</div>
          <h2 className="ad-section-title">All Users</h2>
        </div>
        <div className="ad-count-pill">{filtered.length} users</div>
      </div>

      <div className="ad-toolbar">
        <div className="ad-search-wrap">
          <span className="ad-search-icon">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </span>
          <input
            className="ad-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ad-filter-pills">
          {["ALL", "CANDIDATE", "EMPLOYER", "ADMIN"].map((r) => (
            <button
              key={r}
              className={`ad-filter-pill ${roleFilter === r ? "ad-filter-pill--active" : ""}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()} ({roleCounts[r]})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="ad-skeleton-list">
          {[1,2,3,4,5].map(i => <div key={i} className="ad-skeleton-row" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Empty icon="◈" title="No users found" sub="Try a different search or filter" />
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ "--row-delay": `${i * 35}ms` }}>
                  <td className="ad-td-dim">{u.id}</td>
                  <td>
                    <div className="ad-user-cell">
                      <div className="ad-user-avatar">
                        {u.name?.[0] || "?"}
                      </div>
                      <span className="ad-td-name">{u.name}</span>
                    </div>
                  </td>
                  <td className="ad-td-muted">{u.email}</td>
                  <td><StatusBadge status={u.role} /></td>
                  <td className="ad-td-muted">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <button
                      className="ad-icon-btn ad-icon-btn--red"
                      title="Delete user"
                      onClick={() => setDeleteId(u.id)}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 3h9M5 3V1.5h3V3M4 3l.5 8h4l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete User" width={400}>
        <p className="ad-modal-text">
          Are you sure you want to permanently delete this user? All associated data including profiles, applications, and orders will be affected.
        </p>
        <div className="ad-modal-actions">
          <button className="ad-btn ad-btn--ghost" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="ad-btn ad-btn--danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete User"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Placements
───────────────────────────────────────── */
function Placements({ notify }) {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ candidateId: "", employerId: "", vacancyId: "", startDate: "", contractUrl: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const d = await apiFetch("/placements");
      setPlacements(Array.isArray(d) ? d : []);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.candidateId || !form.employerId) { notify("Candidate ID and Employer ID are required.", "error"); return; }
    setSaving(true);
    try {
      await apiFetch("/placements", {
        method: "POST",
        body: JSON.stringify({
          candidateId: Number(form.candidateId),
          employerId: Number(form.employerId),
          vacancyId: form.vacancyId ? Number(form.vacancyId) : null,
          startDate: form.startDate || null,
          contractUrl: form.contractUrl || null,
        }),
      });
      notify("Placement created successfully", "success");
      setShowCreate(false);
      setForm({ candidateId: "", employerId: "", vacancyId: "", startDate: "", contractUrl: "" });
      load();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`/placements/${deleteId}`, { method: "DELETE" });
      notify("Placement deleted", "success");
      setDeleteId(null);
      load();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <div className="ad-section">
      <div className="ad-section-header">
        <div>
          <div className="ad-section-eyebrow">Placement Management</div>
          <h2 className="ad-section-title">All Placements</h2>
        </div>
        <button className="ad-btn ad-btn--gold" onClick={() => setShowCreate(true)}>
          + New Placement
        </button>
      </div>

      {loading ? (
        <div className="ad-skeleton-list">{[1,2,3].map(i=><div key={i} className="ad-skeleton-row"/>)}</div>
      ) : placements.length === 0 ? (
        <Empty icon="◉" title="No placements yet" sub="Create the first placement to link candidates to employers"
          action="Create Placement" onAction={() => setShowCreate(true)} />
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Candidate</th>
                <th>Company</th>
                <th>Vacancy</th>
                <th>Start Date</th>
                <th>Contract</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {placements.map((p, i) => (
                <tr key={p.id} style={{ "--row-delay": `${i * 35}ms` }}>
                  <td className="ad-td-dim">{p.id}</td>
                  <td>
                    <div className="ad-user-cell">
                      <div className="ad-user-avatar ad-user-avatar--teal">{p.candidateName?.[0] || "C"}</div>
                      <span className="ad-td-name">{p.candidateName}</span>
                    </div>
                  </td>
                  <td className="ad-td-muted">{p.companyName}</td>
                  <td className="ad-td-muted">{p.vacancyTitle || "—"}</td>
                  <td className="ad-td-muted">
                    {p.startDate ? new Date(p.startDate).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    {p.contractUrl ? (
                      <a href={p.contractUrl} target="_blank" rel="noopener noreferrer" className="ad-link">
                        View ↗
                      </a>
                    ) : <span className="ad-td-dim">None</span>}
                  </td>
                  <td>
                    <button className="ad-icon-btn ad-icon-btn--red" onClick={() => setDeleteId(p.id)}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 3h9M5 3V1.5h3V3M4 3l.5 8h4l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Placement" width={520}>
        <form className="ad-form" onSubmit={handleCreate}>
          <div className="ad-form-grid ad-form-grid--2">
            <Field label="Candidate ID *">
              <input className="ad-input" type="number" placeholder="e.g. 12" value={form.candidateId}
                onChange={e => setForm({...form, candidateId: e.target.value})} />
            </Field>
            <Field label="Employer ID *">
              <input className="ad-input" type="number" placeholder="e.g. 5" value={form.employerId}
                onChange={e => setForm({...form, employerId: e.target.value})} />
            </Field>
            <Field label="Vacancy ID" hint="Optional">
              <input className="ad-input" type="number" placeholder="e.g. 8" value={form.vacancyId}
                onChange={e => setForm({...form, vacancyId: e.target.value})} />
            </Field>
            <Field label="Start Date" hint="Optional">
              <input className="ad-input" type="date" value={form.startDate}
                onChange={e => setForm({...form, startDate: e.target.value})} />
            </Field>
          </div>
          <Field label="Contract URL" hint="Optional — link to contract document">
            <input className="ad-input" placeholder="https://…" value={form.contractUrl}
              onChange={e => setForm({...form, contractUrl: e.target.value})} />
          </Field>
          <div className="ad-modal-actions" style={{marginTop:20}}>
            <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className={`ad-btn ad-btn--gold ${saving?"ad-btn--loading":""}`} disabled={saving}>
              {saving ? <><span className="ad-spinner"/>Creating…</> : "Create Placement"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Placement" width={400}>
        <p className="ad-modal-text">Delete this placement permanently? The candidate's availability will not be automatically restored.</p>
        <div className="ad-modal-actions">
          <button className="ad-btn ad-btn--ghost" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="ad-btn ad-btn--danger" onClick={handleDelete}>Delete Placement</button>
        </div>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Orders
───────────────────────────────────────── */
function Orders({ notify }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [updating, setUpdating] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const d = await apiFetch("/orders");
      setOrders(Array.isArray(d) ? d : []);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id, status) => {
    setUpdating(id);
    try {
      await apiFetch(`/orders/${id}/status?status=${status}`, { method: "PATCH" });
      notify("Order status updated", "success");
      load();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    try {
      await apiFetch(`/orders/${id}`, { method: "DELETE" });
      notify("Order deleted", "success");
      load();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const statuses = ["ALL", "PENDING", "IN_PROGRESS", "FULFILLED", "CANCELLED"];
  const filtered = orders.filter(o => filter === "ALL" || o.status === filter);

  return (
    <div className="ad-section">
      <div className="ad-section-header">
        <div>
          <div className="ad-section-eyebrow">Order Management</div>
          <h2 className="ad-section-title">All Orders</h2>
        </div>
        <div className="ad-count-pill">{filtered.length} orders</div>
      </div>

      <div className="ad-filter-bar">
        {statuses.map(s => (
          <button key={s} className={`ad-filter-pill ${filter===s?"ad-filter-pill--active":""}`} onClick={() => setFilter(s)}>
            {s === "ALL" ? "All" : s.charAt(0)+s.slice(1).toLowerCase().replace("_"," ")}
            {" "}({s==="ALL" ? orders.length : orders.filter(o=>o.status===s).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="ad-skeleton-list">{[1,2,3].map(i=><div key={i} className="ad-skeleton-row"/>)}</div>
      ) : filtered.length === 0 ? (
        <Empty icon="⬡" title="No orders found" sub="Orders placed by employers will appear here" />
      ) : (
        <div className="ad-orders-list">
          {filtered.map((o, i) => (
            <div className="ad-order-row" key={o.id} style={{"--row-delay":`${i*40}ms`}}>
              <div className="ad-order-row-left">
                <div className="ad-order-id">#{o.id}</div>
                <div className="ad-order-info">
                  <div className="ad-order-title">{o.title}</div>
                  <div className="ad-order-company">{o.companyName}</div>
                  {o.description && (
                    <div className="ad-order-desc">
                      {o.description.slice(0,100)}{o.description.length>100?"…":""}
                    </div>
                  )}
                  {o.createdAt && (
                    <div className="ad-order-date">{new Date(o.createdAt).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
              <div className="ad-order-row-right">
                <StatusBadge status={o.status} />
                <div className="ad-order-actions">
                  {o.status === "PENDING" && (
                    <button className="ad-status-btn" disabled={updating===o.id}
                      onClick={() => handleStatus(o.id, "IN_PROGRESS")}>
                      {updating===o.id?"…":"Mark In Progress"}
                    </button>
                  )}
                  {o.status === "IN_PROGRESS" && (
                    <button className="ad-status-btn ad-status-btn--green" disabled={updating===o.id}
                      onClick={() => handleStatus(o.id, "FULFILLED")}>
                      {updating===o.id?"…":"Mark Fulfilled"}
                    </button>
                  )}
                  {(o.status==="PENDING"||o.status==="IN_PROGRESS") && (
                    <button className="ad-status-btn ad-status-btn--red" disabled={updating===o.id}
                      onClick={() => handleStatus(o.id, "CANCELLED")}>Cancel</button>
                  )}
                  <button className="ad-icon-btn ad-icon-btn--red" onClick={() => handleDelete(o.id)}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 3h9M5 3V1.5h3V3M4 3l.5 8h4l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
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
   SECTION: Vacancies
───────────────────────────────────────── */
function Vacancies({ notify }) {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const d = await apiFetch("/vacancies/all");
      setVacancies(Array.isArray(d) ? d : []);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vacancy and all its applications?")) return;
    try {
      await apiFetch(`/vacancies/${id}`, { method: "DELETE" });
      notify("Vacancy deleted", "success");
      load();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleAiFilter = async (v) => {
    try {
      const d = await apiFetch(`/ai/vacancies/${v.id}/filter`, { method: "POST" });
      notify("Vacancy filtered by AI successfully", "success");
    } catch (e) {
      notify("AI filter failed: " + e.message, "error");
    }
  };

  const filtered = vacancies.filter(v => {
    const ms = v.title?.toLowerCase().includes(search.toLowerCase()) ||
      v.companyName?.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="ALL" || v.status===filter;
    return ms && mf;
  });

  return (
    <div className="ad-section">
      <div className="ad-section-header">
        <div>
          <div className="ad-section-eyebrow">Vacancy Oversight</div>
          <h2 className="ad-section-title">All Vacancies</h2>
        </div>
        <div className="ad-count-pill">{filtered.length} postings</div>
      </div>

      <div className="ad-toolbar">
        <div className="ad-search-wrap">
          <span className="ad-search-icon">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </span>
          <input className="ad-search" placeholder="Search by title or company…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="ad-filter-pills">
          {["ALL","OPEN","DRAFT","CLOSED"].map(s => (
            <button key={s} className={`ad-filter-pill ${filter===s?"ad-filter-pill--active":""}`} onClick={() => setFilter(s)}>
              {s==="ALL"?"All":s.charAt(0)+s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="ad-skeleton-list">{[1,2,3,4].map(i=><div key={i} className="ad-skeleton-row"/>)}</div>
      ) : filtered.length===0 ? (
        <Empty icon="✦" title="No vacancies found" sub="Try a different search or filter" />
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>ID</th><th>Title</th><th>Company</th><th>Salary</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.id} style={{"--row-delay":`${i*35}ms`}}>
                  <td className="ad-td-dim">{v.id}</td>
                  <td>
                    <div className="ad-td-name">{v.title}</div>
                    {v.requirements && (
                      <div className="ad-td-sub">{v.requirements.slice(0,50)}{v.requirements.length>50?"…":""}</div>
                    )}
                  </td>
                  <td className="ad-td-muted">{v.companyName || "—"}</td>
                  <td><span className="ad-meta-pill">{v.salaryRange||"—"}</span></td>
                  <td><StatusBadge status={v.status} /></td>
                  <td>
                    <div className="ad-action-row">
                      <button className="ad-icon-btn ad-icon-btn--teal" title="AI Filter Vacancy"
                        onClick={() => handleAiFilter(v)}>
                        <span style={{fontSize:11}}>✦</span>
                      </button>
                      <button className="ad-icon-btn ad-icon-btn--red" title="Delete" onClick={() => handleDelete(v.id)}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M2 3h9M5 3V1.5h3V3M4 3l.5 8h4l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
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
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: Blog Manager
───────────────────────────────────────── */
function BlogManager({ notify }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", publish: false });
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiForm, setAiForm] = useState({ topic: "", targetAudience: "HR professionals", tone: "professional", wordCount: 600 });
  const [showAiPanel, setShowAiPanel] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const [pub, drafts] = await Promise.all([
        apiFetch("/blog").catch(() => []),
        apiFetch("/blog/drafts").catch(() => []),
      ]);
      const all = [...(Array.isArray(pub)?pub:[]), ...(Array.isArray(drafts)?drafts:[])];
      const unique = all.filter((p,i,arr) => arr.findIndex(x=>x.id===p.id)===i);
      unique.sort((a,b) => b.id - a.id);
      setPosts(unique);
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditPost(null);
    setForm({ title: "", content: "", publish: false });
    setShowCreate(true);
  };
  const openEdit = (p) => {
    setEditPost(p);
    setForm({ title: p.title, content: p.content, publish: p.published });
    setShowCreate(true);
  };

  const handleAiGenerate = async () => {
    if (!aiForm.topic) { notify("Please enter a topic", "error"); return; }
    setAiLoading(true);
    try {
      const d = await apiFetch("/ai/generate-blog", {
        method: "POST",
        body: JSON.stringify(aiForm),
      });
      setForm(f => ({ ...f, title: aiForm.topic, content: d.content }));
      setShowAiPanel(false);
      notify("AI blog post generated!", "success");
    } catch (e) {
      notify("AI generation failed: " + e.message, "error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) { notify("Title and content are required", "error"); return; }
    setSaving(true);
    try {
      if (editPost) {
        await apiFetch(`/blog/${editPost.id}`, { method: "PUT", body: JSON.stringify(form) });
        notify("Post updated successfully", "success");
      } else {
        await apiFetch("/blog", { method: "POST", body: JSON.stringify({ ...form, adminId: user.userId }) });
        notify("Post created successfully", "success");
      }
      setShowCreate(false);
      load();
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await apiFetch(`/blog/${id}/publish`, { method: "PATCH" });
      notify("Post published!", "success");
      load();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await apiFetch(`/blog/${id}`, { method: "DELETE" });
      notify("Post deleted", "success");
      load();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  return (
    <div className="ad-section">
      <div className="ad-section-header">
        <div>
          <div className="ad-section-eyebrow">Content Management</div>
          <h2 className="ad-section-title">Blog Manager</h2>
        </div>
        <button className="ad-btn ad-btn--gold" onClick={openCreate}>+ New Post</button>
      </div>

      {loading ? (
        <div className="ad-skeleton-list">{[1,2,3].map(i=><div key={i} className="ad-skeleton-row"/>)}</div>
      ) : posts.length===0 ? (
        <Empty icon="◎" title="No posts yet" sub="Create your first blog post with AI assistance"
          action="New Post" onAction={openCreate} />
      ) : (
        <div className="ad-blog-list">
          {posts.map((p, i) => (
            <div className="ad-blog-row" key={p.id} style={{"--row-delay":`${i*45}ms`}}>
              <div className="ad-blog-row-left">
                <div className="ad-blog-title">{p.title}</div>
                <div className="ad-blog-meta">
                  <span className="ad-blog-author">By {p.authorName}</span>
                  {p.published ? (
                    <span className="ad-blog-pub-tag ad-blog-pub-tag--live">● Published</span>
                  ) : (
                    <span className="ad-blog-pub-tag ad-blog-pub-tag--draft">Draft</span>
                  )}
                  {p.publishedAt && (
                    <span className="ad-blog-date">{new Date(p.publishedAt).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="ad-blog-excerpt">
                  {p.content?.replace(/#|##|###|\*\*/g,"").slice(0,120)}…
                </div>
              </div>
              <div className="ad-blog-row-actions">
                {!p.published && (
                  <button className="ad-status-btn ad-status-btn--green" onClick={() => handlePublish(p.id)}>
                    Publish
                  </button>
                )}
                <button className="ad-icon-btn ad-icon-btn--teal" title="Edit" onClick={() => openEdit(p)}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="ad-icon-btn ad-icon-btn--red" title="Delete" onClick={() => handleDelete(p.id)}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 3h9M5 3V1.5h3V3M4 3l.5 8h4l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)}
        title={editPost ? "Edit Blog Post" : "New Blog Post"} width={680}>

        {/* AI panel toggle */}
        {!editPost && (
          <div className="ad-ai-banner">
            <div className="ad-ai-banner-left">
              <span className="ad-ai-badge"><span className="ad-ai-dot"/>Gemini AI</span>
              <span className="ad-ai-text">Generate a full blog post with AI in seconds.</span>
            </div>
            <button className="ad-btn ad-btn--teal-outline" onClick={() => setShowAiPanel(!showAiPanel)}>
              {showAiPanel ? "Hide" : "Generate with AI ✦"}
            </button>
          </div>
        )}

        {showAiPanel && (
          <div className="ad-ai-panel">
            <div className="ad-ai-panel-title">AI Blog Generator</div>
            <div className="ad-ai-panel-grid">
              <Field label="Topic *">
                <input className="ad-input" placeholder="e.g. Top 5 Resume Tips for 2025"
                  value={aiForm.topic} onChange={e=>setAiForm({...aiForm,topic:e.target.value})} />
              </Field>
              <Field label="Target Audience">
                <select className="ad-input ad-select" value={aiForm.targetAudience}
                  onChange={e=>setAiForm({...aiForm,targetAudience:e.target.value})}>
                  {["HR professionals","Job seekers","Employers","Recruiters","General"].map(a=><option key={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Tone">
                <select className="ad-input ad-select" value={aiForm.tone}
                  onChange={e=>setAiForm({...aiForm,tone:e.target.value})}>
                  {["professional","informative","inspiring","conversational","practical"].map(t=><option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Word Count">
                <input className="ad-input" type="number" min="200" max="2000" value={aiForm.wordCount}
                  onChange={e=>setAiForm({...aiForm,wordCount:Number(e.target.value)})} />
              </Field>
            </div>
            <button className={`ad-btn ad-btn--gold ${aiLoading?"ad-btn--loading":""}`}
              onClick={handleAiGenerate} disabled={aiLoading}>
              {aiLoading ? <><span className="ad-spinner"/>Generating…</> : "Generate Post ✦"}
            </button>
          </div>
        )}

        <form className="ad-form" onSubmit={handleSave}>
          <Field label="Post Title *">
            <input className="ad-input" placeholder="e.g. How AI is Changing Recruitment"
              value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
          </Field>
          <Field label="Content *" hint="Markdown is supported">
            <textarea className="ad-input ad-textarea ad-textarea--tall"
              placeholder="Write your blog post content here…"
              value={form.content} onChange={e=>setForm({...form,content:e.target.value})} rows={10} />
          </Field>
          <label className="ad-checkbox-row">
            <input type="checkbox" className="ad-checkbox" checked={form.publish}
              onChange={e=>setForm({...form,publish:e.target.checked})} />
            <span className="ad-checkbox-custom"/>
            <span className="ad-checkbox-label">Publish immediately</span>
          </label>
          <div className="ad-modal-actions" style={{marginTop:20}}>
            <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className={`ad-btn ad-btn--gold ${saving?"ad-btn--loading":""}`} disabled={saving}>
              {saving ? <><span className="ad-spinner"/>{editPost?"Saving…":"Creating…"}</> : (editPost?"Save Changes":"Create Post")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────────────────────
   SECTION: AI Tools Hub
───────────────────────────────────────── */
function AiTools({ notify }) {
  const [activeAi, setActiveAi] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState("");

  /* form states */
  const [contractForm, setContractForm] = useState({ candidateId:"", employerId:"", vacancyId:"", startDate:"", salaryAmount:"", contractDuration:"12 months", additionalTerms:"" });
  const [emailForm, setEmailForm] = useState({ emailType:"interview_invite", recipientName:"", recipientRole:"candidate", tone:"professional", contextDetails:"" });
  const [bioForm, setBioForm]     = useState({ candidateId:"" });
  const [bioFilterForm, setBioFilterForm] = useState({ candidateId:"", policies:"" });
  const [recForm, setRecForm]     = useState({ vacancyId:"", minExperience:"" });
  const [vacForm, setVacForm]     = useState({ employerId:"", jobTitle:"", salaryRange:"", experienceLevel:"Mid-level", keySkills:"" });

  const emailTypes = ["interview_invite","rejection","offer","follow_up","welcome","reference_request"];

  const aiTools = [
    { id:"contract",   icon:"◉", title:"Contract Generator",     desc:"Auto-generate legal employment contracts from placement data." },
    { id:"email",      icon:"✧", title:"Email Creator",           desc:"Create professional recruitment email templates instantly." },
    { id:"bio",        icon:"◈", title:"Candidate Bio Generator", desc:"Generate a polished professional bio for any candidate." },
    { id:"bio-filter", icon:"⬡", title:"Bio Filter",              desc:"Clean and compliance-check a candidate's existing bio." },
    { id:"recommend",  icon:"✦", title:"Candidate Recommender",   desc:"AI ranks best candidates for a specific vacancy." },
    { id:"vacancy-gen",icon:"◎", title:"Vacancy Generator",       desc:"Generate a complete professional job vacancy posting." },
  ];

  const runAi = async () => {
    setLoading(true);
    setResult("");
    try {
      let data;
      switch (activeAi) {
        case "contract":
          data = await apiFetch("/ai/generate-contract", { method:"POST", body: JSON.stringify({
            candidateId: Number(contractForm.candidateId),
            employerId: Number(contractForm.employerId),
            vacancyId: contractForm.vacancyId ? Number(contractForm.vacancyId) : null,
            startDate: contractForm.startDate || null,
            salaryAmount: contractForm.salaryAmount,
            contractDuration: contractForm.contractDuration,
            additionalTerms: contractForm.additionalTerms,
          })});
          break;
        case "email":
          data = await apiFetch("/ai/generate-email", { method:"POST", body: JSON.stringify(emailForm) });
          break;
        case "bio":
          data = await apiFetch(`/ai/candidates/${bioForm.candidateId}/generate-bio`, { method:"POST" });
          break;
        case "bio-filter":
          data = await apiFetch(`/ai/candidates/${bioFilterForm.candidateId}/filter-bio`, {
            method:"POST", body: JSON.stringify({ customPrompt: bioFilterForm.policies }) });
          break;
        case "recommend":
          const params = recForm.minExperience ? `?minExperience=${recForm.minExperience}` : "";
          data = await apiFetch(`/ai/vacancies/${recForm.vacancyId}/recommend${params}`);
          break;
        case "vacancy-gen":
          const p = new URLSearchParams({ jobTitle:vacForm.jobTitle, experienceLevel:vacForm.experienceLevel, keySkills:vacForm.keySkills });
          data = await apiFetch(`/ai/employers/${vacForm.employerId}/generate-vacancy?${p}`, { method:"POST" });
          break;
        default: break;
      }
      if (data?.content) setResult(data.content);
      else if (data?.aiAnalysis) setResult(JSON.stringify(data, null, 2));
      else setResult(JSON.stringify(data, null, 2));
      notify("AI generation complete!", "success");
    } catch (e) {
      notify("AI error: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    notify("Copied to clipboard!", "success");
  };

  return (
    <div className="ad-section">
      <div className="ad-section-header">
        <div>
          <div className="ad-section-eyebrow">Artificial Intelligence</div>
          <h2 className="ad-section-title">AI Tools Hub</h2>
        </div>
        <div className="ad-ai-powered-badge">
          <span className="ad-ai-dot"/>Powered by Gemini
        </div>
      </div>

      {/* Tool selector */}
      <div className="ad-ai-tools-grid">
        {aiTools.map((t, i) => (
          <button
            key={t.id}
            className={`ad-ai-tool-card ${activeAi===t.id?"ad-ai-tool-card--active":""}`}
            onClick={() => { setActiveAi(t.id); setResult(""); }}
            style={{"--ql-delay":`${i*60}ms`}}
          >
            <div className="ad-ai-tool-icon">{t.icon}</div>
            <div className="ad-ai-tool-title">{t.title}</div>
            <div className="ad-ai-tool-desc">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Active tool form */}
      {activeAi && (
        <div className="ad-ai-workspace">
          <div className="ad-ai-workspace-title">
            {aiTools.find(t=>t.id===activeAi)?.title}
          </div>

          {activeAi === "contract" && (
            <div className="ad-form-grid ad-form-grid--2">
              <Field label="Candidate ID *"><input className="ad-input" type="number" value={contractForm.candidateId} onChange={e=>setContractForm({...contractForm,candidateId:e.target.value})} placeholder="e.g. 12"/></Field>
              <Field label="Employer ID *"><input className="ad-input" type="number" value={contractForm.employerId} onChange={e=>setContractForm({...contractForm,employerId:e.target.value})} placeholder="e.g. 5"/></Field>
              <Field label="Vacancy ID" hint="Optional"><input className="ad-input" type="number" value={contractForm.vacancyId} onChange={e=>setContractForm({...contractForm,vacancyId:e.target.value})} placeholder="e.g. 8"/></Field>
              <Field label="Start Date"><input className="ad-input" type="date" value={contractForm.startDate} onChange={e=>setContractForm({...contractForm,startDate:e.target.value})}/></Field>
              <Field label="Salary Amount"><input className="ad-input" value={contractForm.salaryAmount} onChange={e=>setContractForm({...contractForm,salaryAmount:e.target.value})} placeholder="e.g. $5,000/month"/></Field>
              <Field label="Contract Duration"><input className="ad-input" value={contractForm.contractDuration} onChange={e=>setContractForm({...contractForm,contractDuration:e.target.value})} placeholder="e.g. 12 months"/></Field>
              <div style={{gridColumn:"span 2"}}>
                <Field label="Additional Terms" hint="Optional clauses">
                  <textarea className="ad-input ad-textarea" rows={3} value={contractForm.additionalTerms} onChange={e=>setContractForm({...contractForm,additionalTerms:e.target.value})} placeholder="Any specific terms to include…"/>
                </Field>
              </div>
            </div>
          )}

          {activeAi === "email" && (
            <div className="ad-form-grid ad-form-grid--2">
              <Field label="Email Type">
                <select className="ad-input ad-select" value={emailForm.emailType} onChange={e=>setEmailForm({...emailForm,emailType:e.target.value})}>
                  {emailTypes.map(t=><option key={t} value={t}>{t.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                </select>
              </Field>
              <Field label="Recipient Name"><input className="ad-input" value={emailForm.recipientName} onChange={e=>setEmailForm({...emailForm,recipientName:e.target.value})} placeholder="e.g. John Doe"/></Field>
              <Field label="Recipient Role">
                <select className="ad-input ad-select" value={emailForm.recipientRole} onChange={e=>setEmailForm({...emailForm,recipientRole:e.target.value})}>
                  <option value="candidate">Candidate</option>
                  <option value="employer">Employer</option>
                </select>
              </Field>
              <Field label="Tone">
                <select className="ad-input ad-select" value={emailForm.tone} onChange={e=>setEmailForm({...emailForm,tone:e.target.value})}>
                  {["professional","formal","friendly","warm"].map(t=><option key={t}>{t}</option>)}
                </select>
              </Field>
              <div style={{gridColumn:"span 2"}}>
                <Field label="Context / Details" hint="Job title, company, dates, etc.">
                  <textarea className="ad-input ad-textarea" rows={3} value={emailForm.contextDetails} onChange={e=>setEmailForm({...emailForm,contextDetails:e.target.value})} placeholder="e.g. Interview for Senior Developer role at TechCorp on Friday at 2pm"/>
                </Field>
              </div>
            </div>
          )}

          {activeAi === "bio" && (
            <Field label="Candidate ID *">
              <input className="ad-input" type="number" value={bioForm.candidateId} onChange={e=>setBioForm({...bioForm,candidateId:e.target.value})} placeholder="e.g. 12" style={{maxWidth:200}}/>
            </Field>
          )}

          {activeAi === "bio-filter" && (
            <div className="ad-form-grid ad-form-grid--2">
              <Field label="Candidate ID *">
                <input className="ad-input" type="number" value={bioFilterForm.candidateId} onChange={e=>setBioFilterForm({...bioFilterForm,candidateId:e.target.value})} placeholder="e.g. 12"/>
              </Field>
              <Field label="Agency Policies" hint="Optional extra rules">
                <input className="ad-input" value={bioFilterForm.policies} onChange={e=>setBioFilterForm({...bioFilterForm,policies:e.target.value})} placeholder="e.g. remove salary expectations…"/>
              </Field>
            </div>
          )}

          {activeAi === "recommend" && (
            <div className="ad-form-grid ad-form-grid--2">
              <Field label="Vacancy ID *">
                <input className="ad-input" type="number" value={recForm.vacancyId} onChange={e=>setRecForm({...recForm,vacancyId:e.target.value})} placeholder="e.g. 8"/>
              </Field>
              <Field label="Min Experience (years)" hint="Optional filter">
                <input className="ad-input" type="number" value={recForm.minExperience} onChange={e=>setRecForm({...recForm,minExperience:e.target.value})} placeholder="e.g. 2"/>
              </Field>
            </div>
          )}

          {activeAi === "vacancy-gen" && (
            <div className="ad-form-grid ad-form-grid--2">
              <Field label="Employer ID *"><input className="ad-input" type="number" value={vacForm.employerId} onChange={e=>setVacForm({...vacForm,employerId:e.target.value})} placeholder="e.g. 5"/></Field>
              <Field label="Job Title *"><input className="ad-input" value={vacForm.jobTitle} onChange={e=>setVacForm({...vacForm,jobTitle:e.target.value})} placeholder="e.g. Senior React Developer"/></Field>
              <Field label="Salary Range"><input className="ad-input" value={vacForm.salaryRange} onChange={e=>setVacForm({...vacForm,salaryRange:e.target.value})} placeholder="e.g. $4,000–$6,000/month"/></Field>
              <Field label="Experience Level">
                <select className="ad-input ad-select" value={vacForm.experienceLevel} onChange={e=>setVacForm({...vacForm,experienceLevel:e.target.value})}>
                  {["Junior","Mid-level","Senior","Lead","Executive"].map(l=><option key={l}>{l}</option>)}
                </select>
              </Field>
              <div style={{gridColumn:"span 2"}}>
                <Field label="Key Skills" hint="Comma-separated">
                  <input className="ad-input" value={vacForm.keySkills} onChange={e=>setVacForm({...vacForm,keySkills:e.target.value})} placeholder="e.g. React, TypeScript, Node.js"/>
                </Field>
              </div>
            </div>
          )}

          <button
            className={`ad-btn ad-btn--gold ad-btn--lg ${loading?"ad-btn--loading":""}`}
            onClick={runAi}
            disabled={loading}
            style={{marginTop:20}}
          >
            {loading ? <><span className="ad-spinner"/>Generating…</> : "Generate with AI ✦"}
          </button>

          {/* Result */}
          {result && (
            <div className="ad-ai-result">
              <div className="ad-ai-result-header">
                <div className="ad-ai-result-label">✦ AI Generated Output</div>
                <button className="ad-btn ad-btn--ghost ad-btn--sm" onClick={copyResult}>Copy</button>
              </div>
              <pre className="ad-ai-result-content">{result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [toast, setToast]                 = useState({ msg: "", type: "success" });

  const [stats, setStats] = useState({
    candidates: 0, employers: 0, vacancies: 0,
    orders: 0, placements: 0, blogs: 0,
  });
  const [loading, setLoading]   = useState(true);
  const [initError, setInitError] = useState("");

  const notify = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [cands, emps, vacs, ords, placed, blogs] = await Promise.allSettled([
        apiFetch("/candidates"),
        apiFetch("/employers"),
        apiFetch("/vacancies/all"),
        apiFetch("/orders"),
        apiFetch("/placements"),
        apiFetch("/blog"),
      ]);
      setStats({
        candidates: cands.value?.length  || 0,
        employers:  emps.value?.length   || 0,
        vacancies:  vacs.value?.length   || 0,
        orders:     ords.value?.length   || 0,
        placements: placed.value?.length || 0,
        blogs:      blogs.value?.length  || 0,
      });
    } catch (e) {
      setInitError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (section) => {
    if (section === "ai-tools") {
      navigate("/ai/tools");
      return;
    }
    setActiveSection(section);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="ad-loading-screen">
        <div className="ad-loading-brand">
          <span className="ad-loading-icon">⬡</span>
          <span className="ad-loading-text">IntelliRecruit</span>
        </div>
        <div className="ad-loading-bar"><div className="ad-loading-fill"/></div>
        <div className="ad-loading-label">Loading admin workspace…</div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="ad-error-screen">
        <div className="ad-error-icon">⚠</div>
        <div className="ad-error-title">Dashboard failed to load</div>
        <div className="ad-error-sub">{initError}</div>
        <button className="ad-btn ad-btn--gold" onClick={loadStats}>Retry</button>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const navItems = [
    { id: "overview",   icon: "◈", label: "Overview" },
    { id: "users",      icon: "◉", label: "Users",      badge: stats.candidates + stats.employers },
    { id: "placements", icon: "⬡", label: "Placements", badge: stats.placements },
    { id: "orders",     icon: "◎", label: "Orders",     badge: stats.orders },
    { id: "vacancies",  icon: "✦", label: "Vacancies",  badge: stats.vacancies },
    { id: "blog",       icon: "✧", label: "Blog",       badge: stats.blogs },
    { id: "ai-tools",   icon: "❖", label: "AI Tools" },
  ];

  return (
    <div className="ad-root">
      {/* Global toast */}
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg:"", type:"success" })} />

      {/* Ambient */}
      <div className="ad-ambient">
        <div className="ad-ambient-orb ad-ambient-orb--1"/>
        <div className="ad-ambient-orb ad-ambient-orb--2"/>
        <div className="ad-ambient-orb ad-ambient-orb--3"/>
        <div className="ad-grid-overlay"/>
      </div>

      {/* Mobile topbar */}
      <div className="ad-topbar">
        <button className="ad-topbar-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
          <span/><span/><span/>
        </button>
        <div className="ad-topbar-brand">
          <span className="ad-brand-icon">⬡</span>
          <span className="ad-brand-text">IntelliRecruit</span>
        </div>
        <div className="ad-topbar-avatar">{user?.name?.[0] || "A"}</div>
      </div>

      {sidebarOpen && <div className="ad-sidebar-overlay" onClick={() => setSidebarOpen(false)}/>}

      {/* Sidebar */}
      <aside className={`ad-sidebar ${sidebarOpen ? "ad-sidebar--open" : ""}`}>
        <div className="ad-sidebar-brand">
          <span className="ad-brand-icon">⬡</span>
          <span className="ad-brand-text">IntelliRecruit</span>
        </div>
        <div className="ad-sidebar-role">
          <span className="ad-role-dot"/>
          <span className="ad-role-text">Admin Control Centre</span>
        </div>
        <div className="ad-sidebar-user">
          <div className="ad-sidebar-avatar">{user?.name?.[0] || "A"}</div>
          <div className="ad-sidebar-user-info">
            <div className="ad-sidebar-user-name">{user?.name || "Administrator"}</div>
            <div className="ad-sidebar-user-email">{user?.email}</div>
          </div>
        </div>

        {/* Platform health mini */}
        <div className="ad-sidebar-health">
          <div className="ad-health-row">
            <span className="ad-health-dot ad-health-dot--white"/>
            <span className="ad-health-label">API Connected</span>
          </div>
          <div className="ad-health-row">
            <span className="ad-health-dot ad-health-dot--white"/>
            <span className="ad-health-label">Gemini AI Active</span>
          </div>
        </div>

        <div className="ad-sidebar-divider"/>

        <nav className="ad-sidebar-nav">
          {navItems.map(item => (
            <NavItem key={item.id} icon={item.icon} label={item.label}
              active={activeSection===item.id} onClick={() => handleNavigate(item.id)} badge={item.badge}/>
          ))}
        </nav>

        <div className="ad-sidebar-divider"/>

        <button className="ad-logout-btn" onClick={handleLogout}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M6 13H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 10l3-3-3-3M13 7H6"
              stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign Out
        </button>
      </aside>

      {/* Main */}
      <main className="ad-main">
        {activeSection === "overview"   && <Overview stats={stats} onNavigate={handleNavigate} />}
        {activeSection === "users"      && <Users notify={notify} />}
        {activeSection === "placements" && <Placements notify={notify} />}
        {activeSection === "orders"     && <Orders notify={notify} />}
        {activeSection === "vacancies"  && <Vacancies notify={notify} />}
        {activeSection === "blog"       && <BlogManager notify={notify} />}
        {activeSection === "ai-tools"   && <AiTools notify={notify} />}
      </main>
    </div>
  );
}