import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "./AiToolsPage.css";

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
   Tool registry — all 8 AI features
───────────────────────────────────────── */
const TOOLS = [
  {
    id: "bio-generator",
    icon: "◈",
    category: "Candidate",
    title: "Bio Generator",
    tagline: "Turn raw data into a polished professional biography.",
    desc: "Gemini reads your candidate's skills, experience and existing notes to draft a compelling, ready-to-publish bio in seconds.",
    roles: ["CANDIDATE"],
    accent: "#ffffff",
    accentDim: "rgba(255,255,255,0.1)",
    badge: "Personal",
  },
  {
    id: "bio-filter",
    icon: "◉",
    category: "Candidate",
    title: "Bio Filter",
    tagline: "Strip policy violations before a bio goes live.",
    desc: "Automatically removes discriminatory language, contact details, salary demands and any content that violates your agency's terms of service.",
    roles: ["ADMIN"],
    accent: "#ffffff",
    accentDim: "rgba(255,255,255,0.1)",
    badge: "Compliance",
  },
  {
    id: "vacancy-generator",
    icon: "✦",
    category: "Employer",
    title: "Vacancy Generator",
    tagline: "Write a complete, attractive job posting with one click.",
    desc: "Provide a job title and key skills — Gemini crafts a full vacancy with overview, responsibilities, requirements and offer sections.",
    roles: ["ADMIN", "EMPLOYER"],
    accent: "#ffffff",
    accentDim: "rgba(255,255,255,0.1)",
    badge: "Time-Saver",
  },
  {
    id: "vacancy-filter",
    icon: "⬡",
    category: "Employer",
    title: "Vacancy Filter",
    tagline: "Enforce quality and compliance on every job posting.",
    desc: "Rewrites discriminatory, vague or non-compliant vacancy text to meet your agency's standards — automatically, at scale.",
    roles: ["ADMIN"],
    accent: "#ffffff",
    accentDim: "rgba(255,255,255,0.1)",
    badge: "Quality",
  },
  {
    id: "recommendations",
    icon: "◎",
    category: "Matching",
    title: "Candidate Recommender",
    tagline: "AI ranks every available candidate for a given vacancy.",
    desc: "Gemini analyses vacancy requirements against candidate bios, skills and experience — then returns a scored, reasoned ranked list.",
    roles: ["ADMIN", "EMPLOYER"],
    accent: "#ffffff",
    accentDim: "rgba(255,255,255,0.1)",
    badge: "Core AI",
  },
  {
    id: "contract-generator",
    icon: "✧",
    category: "Legal",
    title: "Contract Generator",
    tagline: "Draft legally-structured employment contracts instantly.",
    desc: "Supply the parties, position, salary and duration — Gemini produces a complete contract with all standard clauses and a signature block.",
    roles: ["ADMIN"],
    accent: "#ffffff",
    accentDim: "rgba(255,255,255,0.1)",
    badge: "Admin Only",
  },
  {
    id: "email-generator",
    icon: "✉",
    category: "Communications",
    title: "Email Creator",
    tagline: "Never stare at a blank email again.",
    desc: "Choose the email type — interview invite, rejection, offer, follow-up — and get a professional, tone-matched template in seconds.",
    roles: ["ADMIN", "EMPLOYER"],
    accent: "#ffffff",
    accentDim: "rgba(255,255,255,0.1)",
    badge: "Popular",
  },
  {
    id: "blog-generator",
    icon: "◑",
    category: "Content",
    title: "Blog Generator",
    tagline: "Publish thought-leadership content without a copywriter.",
    desc: "Give a topic, audience and tone — Gemini returns a full, SEO-friendly blog post with H1, subheadings, bullet points and a CTA.",
    roles: ["ADMIN"],
    accent: "#ffffff",
    accentDim: "rgba(255,255,255,0.1)",
    badge: "Content",
  },
];

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function Field({ label, hint, children }) {
  return (
    <div className="at-field">
      <label className="at-field-label">{label}</label>
      {children}
      {hint && <span className="at-field-hint">{hint}</span>}
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className={`at-toast at-toast--${type}`}>
      <span>{type === "success" ? "✓" : "⚠"} {msg}</span>
      <button className="at-toast-close" onClick={onClose}>✕</button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Result Pane
───────────────────────────────────────── */
function ResultPane({ result, loading, onCopy, onClear }) {
  const ref = useRef(null);
  useEffect(() => {
    if (result && ref.current) {
      ref.current.scrollTop = 0;
    }
  }, [result]);

  if (!result && !loading) return null;

  return (
    <div className="at-result-pane">
      <div className="at-result-header">
        <div className="at-result-header-left">
          <span className="at-result-dot" />
          <span className="at-result-label">AI Output</span>
          {result && (
            <span className="at-result-chars">
              {result.length.toLocaleString()} characters
            </span>
          )}
        </div>
        {result && (
          <div className="at-result-actions">
            <button className="at-result-btn" onClick={onCopy}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
                <path d="M2 9V2a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Copy
            </button>
            <button className="at-result-btn at-result-btn--clear" onClick={onClear}>
              Clear
            </button>
          </div>
        )}
      </div>
      <div className="at-result-body" ref={ref}>
        {loading ? (
          <div className="at-result-loading">
            <div className="at-result-spinner">
              <div className="at-spinner-ring" />
              <div className="at-spinner-ring at-spinner-ring--2" />
              <div className="at-spinner-ring at-spinner-ring--3" />
            </div>
            <div className="at-result-loading-text">
              <span className="at-generating-label">Gemini is generating</span>
              <span className="at-generating-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        ) : (
          <div className="at-result-text">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Individual Tool Forms
───────────────────────────────────────── */

function BioGeneratorForm({ onRun, loading }) {
  const [f, setF] = useState({ customPrompt: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    onRun(f);
  };
  return (
    <form className="at-form" onSubmit={submit}>
      <Field label="Custom Instructions" hint="Optional — additional focus areas or style preferences">
        <textarea className="at-input at-textarea" rows={4} placeholder="e.g. Emphasise leadership skills and remote work experience…" value={f.customPrompt} onChange={set("customPrompt")} />
      </Field>
      <button className={`at-run-btn ${loading ? "at-run-btn--loading" : ""}`} type="submit" disabled={loading}>
        {loading ? <><span className="at-btn-spinner" /> Generating…</> : <><span>✦</span> Generate Bio</>}
      </button>
    </form>
  );
}

function BioFilterForm({ onRun, loading }) {
  const [f, setF] = useState({ candidateEmail: "", policies: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!f.candidateEmail) return;
    onRun(f);
  };
  return (
    <form className="at-form" onSubmit={submit}>
      <Field label="Candidate Email *" hint="The email of the candidate whose bio will be filtered">
        <input className="at-input" placeholder="e.g. candidate@example.com" value={f.candidateEmail} onChange={set("candidateEmail")} />
      </Field>
      <Field label="Agency Policies" hint="Optional — specific rules to apply beyond the defaults">
        <textarea className="at-input at-textarea" rows={3} placeholder="e.g. Remove all references to competitor companies, ensure GDPR compliance language…" value={f.policies} onChange={set("policies")} />
      </Field>
      <div className="at-info-box">
        <span className="at-info-icon">ℹ</span>
        <span>Default rules: removes discriminatory language, contact details, salary demands and unprofessional content.</span>
      </div>
      <button className={`at-run-btn ${loading ? "at-run-btn--loading" : ""}`} type="submit" disabled={loading || !f.candidateEmail}>
        {loading ? <><span className="at-btn-spinner" /> Filtering…</> : <><span>◉</span> Filter Bio</>}
      </button>
    </form>
  );
}

function VacancyGeneratorForm({ onRun, loading }) {
  const [f, setF] = useState({ employerEmail: "", jobTitle: "", salaryRange: "", experienceLevel: "Mid-level", keySkills: "", customPrompt: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!f.employerEmail || !f.jobTitle) return;
    onRun(f);
  };
  return (
    <form className="at-form" onSubmit={submit}>
      <div className="at-form-row">
        <Field label="Employer Email *">
          <input className="at-input" placeholder="e.g. employer@company.com" value={f.employerEmail} onChange={set("employerEmail")} />
        </Field>
        <Field label="Job Title *">
          <input className="at-input" placeholder="e.g. Senior React Developer" value={f.jobTitle} onChange={set("jobTitle")} />
        </Field>
      </div>
      <div className="at-form-row">
        <Field label="Salary Range">
          <input className="at-input" placeholder="e.g. $4,000 – $6,000 / month" value={f.salaryRange} onChange={set("salaryRange")} />
        </Field>
        <Field label="Experience Level">
          <select className="at-input at-select" value={f.experienceLevel} onChange={set("experienceLevel")}>
            {["Junior", "Mid-level", "Senior", "Lead", "Executive"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Key Skills" hint="Comma-separated list of required skills">
        <input className="at-input" placeholder="e.g. React, TypeScript, Node.js, PostgreSQL" value={f.keySkills} onChange={set("keySkills")} />
      </Field>
      <Field label="Additional Instructions" hint="Optional — tone, perks, remote policy, etc.">
        <textarea className="at-input at-textarea" rows={2} placeholder="e.g. Emphasise remote-first culture and equity package…" value={f.customPrompt} onChange={set("customPrompt")} />
      </Field>
      <button className={`at-run-btn ${loading ? "at-run-btn--loading" : ""}`} type="submit" disabled={loading || !f.employerEmail || !f.jobTitle}>
        {loading ? <><span className="at-btn-spinner" /> Generating…</> : <><span>✦</span> Generate Vacancy</>}
      </button>
    </form>
  );
}

function VacancyFilterForm({ onRun, loading }) {
  const [f, setF] = useState({ vacancyId: "", policies: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!f.vacancyId) return;
    onRun(f);
  };
  return (
    <form className="at-form" onSubmit={submit}>
      <Field label="Vacancy ID *" hint="ID of the vacancy posting to filter">
        <input className="at-input" type="number" placeholder="e.g. 8" value={f.vacancyId} onChange={set("vacancyId")} />
      </Field>
      <Field label="Agency-Specific Policies" hint="Optional — additional compliance rules">
        <textarea className="at-input at-textarea" rows={3} placeholder="e.g. Ensure salary transparency, remove age requirements, enforce inclusive pronouns…" value={f.policies} onChange={set("policies")} />
      </Field>
      <button className={`at-run-btn ${loading ? "at-run-btn--loading" : ""}`} type="submit" disabled={loading || !f.vacancyId}>
        {loading ? <><span className="at-btn-spinner" /> Filtering…</> : <><span>⬡</span> Filter Vacancy</>}
      </button>
    </form>
  );
}

function RecommendationsForm({ onRun, loading }) {
  const [f, setF] = useState({ vacancyId: "", minExperience: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!f.vacancyId) return;
    onRun(f);
  };
  return (
    <form className="at-form" onSubmit={submit}>
      <div className="at-form-row">
        <Field label="Vacancy ID *" hint="The role to match candidates against">
          <input className="at-input" type="number" placeholder="e.g. 7" value={f.vacancyId} onChange={set("vacancyId")} />
        </Field>
        <Field label="Min. Experience (years)" hint="Optional filter for available candidates">
          <input className="at-input" type="number" min="0" max="40" placeholder="e.g. 2" value={f.minExperience} onChange={set("minExperience")} />
        </Field>
      </div>
      <div className="at-info-box">
        <span className="at-info-icon">ℹ</span>
        <span>Gemini analyses each available candidate's bio, skills and experience against the vacancy requirements and returns a ranked list with match scores and reasoning.</span>
      </div>
      <button className={`at-run-btn ${loading ? "at-run-btn--loading" : ""}`} type="submit" disabled={loading || !f.vacancyId}>
        {loading ? <><span className="at-btn-spinner" /> Analysing…</> : <><span>◎</span> Get Recommendations</>}
      </button>
    </form>
  );
}

function ContractGeneratorForm({ onRun, loading }) {
  const [f, setF] = useState({
    candidateEmail: "", employerEmail: "", vacancyId: "",
    startDate: "", salaryAmount: "",
    contractDuration: "12 months", additionalTerms: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!f.candidateEmail || !f.employerEmail) return;
    onRun(f);
  };
  return (
    <form className="at-form" onSubmit={submit}>
      <div className="at-form-row">
        <Field label="Candidate Email *">
          <input className="at-input" placeholder="e.g. candidate@example.com" value={f.candidateEmail} onChange={set("candidateEmail")} />
        </Field>
        <Field label="Employer Email *">
          <input className="at-input" placeholder="e.g. employer@company.com" value={f.employerEmail} onChange={set("employerEmail")} />
        </Field>
      </div>
      <div className="at-form-row">
        <Field label="Vacancy ID" hint="Optional">
          <input className="at-input" type="number" placeholder="e.g. 8" value={f.vacancyId} onChange={set("vacancyId")} />
        </Field>
        <Field label="Start Date">
          <input className="at-input" type="date" value={f.startDate} onChange={set("startDate")} />
        </Field>
      </div>
      <div className="at-form-row">
        <Field label="Salary / Compensation">
          <input className="at-input" placeholder="e.g. $5,000 / month" value={f.salaryAmount} onChange={set("salaryAmount")} />
        </Field>
        <Field label="Contract Duration">
          <select className="at-input at-select" value={f.contractDuration} onChange={set("contractDuration")}>
            {["3 months", "6 months", "12 months", "24 months", "Permanent"].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Additional Terms" hint="Optional — extra clauses, benefits, confidentiality notes">
        <textarea className="at-input at-textarea" rows={3} placeholder="e.g. Includes 25 days annual leave, health insurance, equipment allowance…" value={f.additionalTerms} onChange={set("additionalTerms")} />
      </Field>
      <button className={`at-run-btn ${loading ? "at-run-btn--loading" : ""}`} type="submit" disabled={loading || !f.candidateEmail || !f.employerEmail}>
        {loading ? <><span className="at-btn-spinner" /> Drafting…</> : <><span>✧</span> Generate Contract</>}
      </button>
    </form>
  );
}

function EmailGeneratorForm({ onRun, loading }) {
  const emailTypes = [
    { value: "interview_invite", label: "Interview Invite" },
    { value: "rejection", label: "Rejection" },
    { value: "offer", label: "Job Offer" },
    { value: "follow_up", label: "Follow-Up" },
    { value: "welcome", label: "Welcome / Onboarding" },
    { value: "reference_request", label: "Reference Request" },
  ];
  const [f, setF] = useState({
    emailType: "interview_invite", recipientName: "", recipientEmail: "",
    recipientRole: "candidate", tone: "professional", contextDetails: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    onRun(f);
  };
  return (
    <form className="at-form" onSubmit={submit}>
      <div className="at-form-row">
        <Field label="Email Type *">
          <select className="at-input at-select" value={f.emailType} onChange={set("emailType")}>
            {emailTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Recipient Name">
          <input className="at-input" placeholder="e.g. Sarah Mitchell" value={f.recipientName} onChange={set("recipientName")} />
        </Field>
        <Field label="Recipient Email *">
          <input className="at-input" placeholder="e.g. sarah@example.com" value={f.recipientEmail} onChange={set("recipientEmail")} />
        </Field>
      </div>
      <div className="at-form-row">
        <Field label="Recipient Role">
          <select className="at-input at-select" value={f.recipientRole} onChange={set("recipientRole")}>
            <option value="candidate">Candidate</option>
            <option value="employer">Employer</option>
          </select>
        </Field>
        <Field label="Tone">
          <select className="at-input at-select" value={f.tone} onChange={set("tone")}>
            {["professional", "formal", "friendly", "warm", "direct"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Context & Details" hint="Job title, company name, interview date/time, relevant details">
        <textarea className="at-input at-textarea" rows={3} placeholder="e.g. Interview for Senior React Developer role at TechCorp — Friday 14 March at 2:00 PM via Zoom" value={f.contextDetails} onChange={set("contextDetails")} />
      </Field>
      <button className={`at-run-btn ${loading ? "at-run-btn--loading" : ""}`} type="submit" disabled={loading || !f.recipientEmail}>
        {loading ? <><span className="at-btn-spinner" /> Composing…</> : <><span>✉</span> Generate Email</>}
      </button>
    </form>
  );
}

function BlogGeneratorForm({ onRun, loading }) {
  const [f, setF] = useState({
    topic: "", targetAudience: "HR professionals",
    tone: "informative", wordCount: 600, keywords: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!f.topic) return;
    onRun(f);
  };
  return (
    <form className="at-form" onSubmit={submit}>
      <Field label="Blog Topic *" hint="Be specific — the more detail, the better the output">
        <input className="at-input" placeholder="e.g. How AI is Changing Recruitment in 2025" value={f.topic} onChange={set("topic")} />
      </Field>
      <div className="at-form-row">
        <Field label="Target Audience">
          <select className="at-input at-select" value={f.targetAudience} onChange={set("targetAudience")}>
            {["HR professionals", "Job seekers", "Employers", "Recruiters", "Business owners", "General"].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>
        <Field label="Tone">
          <select className="at-input at-select" value={f.tone} onChange={set("tone")}>
            {["informative", "inspiring", "practical", "conversational", "authoritative"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="at-form-row">
        <Field label="Target Word Count">
          <input className="at-input" type="number" min="200" max="2000" step="50" value={f.wordCount} onChange={set("wordCount")} />
        </Field>
        <Field label="SEO Keywords" hint="Comma-separated, natural inclusion">
          <input className="at-input" placeholder="e.g. AI recruitment, hire faster, talent matching" value={f.keywords} onChange={set("keywords")} />
        </Field>
      </div>
      <button className={`at-run-btn ${loading ? "at-run-btn--loading" : ""}`} type="submit" disabled={loading || !f.topic}>
        {loading ? <><span className="at-btn-spinner" /> Writing…</> : <><span>◑</span> Generate Blog Post</>}
      </button>
    </form>
  );
}

/* ─────────────────────────────────────────
   API caller per tool
───────────────────────────────────────── */
async function runTool(toolId, formData) {
  switch (toolId) {
    case "bio-generator": {
      const body = formData.customPrompt ? { customPrompt: formData.customPrompt } : null;
      const d = await apiFetch(`/ai/candidates/me/generate-bio`, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      return d?.content || JSON.stringify(d, null, 2);
    }
    case "bio-filter": {
      const d = await apiFetch(`/ai/candidates/filter-bio?email=${encodeURIComponent(formData.candidateEmail)}`, {
        method: "POST",
        body: JSON.stringify({ customPrompt: formData.policies }),
      });
      return d?.content || JSON.stringify(d, null, 2);
    }
    case "vacancy-generator": {
      const params = new URLSearchParams({
        email: formData.employerEmail,
        jobTitle: formData.jobTitle,
        experienceLevel: formData.experienceLevel,
        ...(formData.salaryRange && { salaryRange: formData.salaryRange }),
        ...(formData.keySkills && { keySkills: formData.keySkills }),
      });
      const d = await apiFetch(`/ai/employers/generate-vacancy?${params}`, {
        method: "POST",
        body: formData.customPrompt
          ? JSON.stringify({ customPrompt: formData.customPrompt })
          : undefined,
      });
      return d?.content || JSON.stringify(d, null, 2);
    }
    case "vacancy-filter": {
      const d = await apiFetch(`/ai/vacancies/${formData.vacancyId}/filter`, {
        method: "POST",
        body: JSON.stringify({ customPrompt: formData.policies }),
      });
      return d?.content || JSON.stringify(d, null, 2);
    }
    case "recommendations": {
      const qs = formData.minExperience ? `?minExperience=${formData.minExperience}` : "";
      const d = await apiFetch(`/ai/vacancies/${formData.vacancyId}/recommend${qs}`);
      if (d?.rankedCandidates) {
        let out = `AI Analysis:\n${d.aiAnalysis}\n\n`;
        out += `Vacancy: ${d.vacancyTitle} (ID: ${d.vacancyId})\n\n`;
        out += `Ranked Candidates:\n`;
        d.rankedCandidates.forEach((c) => {
          out += `\n#${c.rank} — ${c.name} (ID: ${c.candidateId})\n`;
          out += `  Match Score: ${c.matchScore}%\n`;
          out += `  Reasoning: ${c.reasoning}\n`;
        });
        return out;
      }
      return JSON.stringify(d, null, 2);
    }
    case "contract-generator": {
      const d = await apiFetch("/ai/generate-contract", {
        method: "POST",
        body: JSON.stringify({
          candidateEmail: formData.candidateEmail,
          employerEmail: formData.employerEmail,
          vacancyId: formData.vacancyId ? Number(formData.vacancyId) : null,
          startDate: formData.startDate || null,
          salaryAmount: formData.salaryAmount,
          contractDuration: formData.contractDuration,
          additionalTerms: formData.additionalTerms,
        }),
      });
      return d?.content || JSON.stringify(d, null, 2);
    }
    case "email-generator": {
      const d = await apiFetch("/ai/generate-email", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      return d?.content || JSON.stringify(d, null, 2);
    }
    case "blog-generator": {
      const d = await apiFetch("/ai/generate-blog", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      return d?.content || JSON.stringify(d, null, 2);
    }
    default:
      throw new Error("Unknown tool");
  }
}

const FORM_MAP = {
  "bio-generator": BioGeneratorForm,
  "bio-filter": BioFilterForm,
  "vacancy-generator": VacancyGeneratorForm,
  "vacancy-filter": VacancyFilterForm,
  "recommendations": RecommendationsForm,
  "contract-generator": ContractGeneratorForm,
  "email-generator": EmailGeneratorForm,
  "blog-generator": BlogGeneratorForm,
};

/* ─────────────────────────────────────────
   History item
───────────────────────────────────────── */
function HistoryEntry({ entry, onRestore }) {
  return (
    <div className="at-history-entry">
      <div className="at-history-icon" style={{ color: entry.accent }}>
        {entry.icon}
      </div>
      <div className="at-history-info">
        <div className="at-history-title">{entry.title}</div>
        <div className="at-history-time">{entry.time}</div>
        <div className="at-history-preview">
          {entry.result.slice(0, 90)}{entry.result.length > 90 ? "…" : ""}
        </div>
      </div>
      <button className="at-history-restore" onClick={() => onRestore(entry)}>
        Restore
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function AiToolsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.role || "ADMIN";

  const [activeTool, setActiveTool] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showHistory, setShowHistory] = useState(false);

  const notify = (msg, type = "success") => setToast({ msg, type });

  /* filter tools by role and search */
  const categories = ["All", ...Array.from(new Set(TOOLS.map((t) => t.category)))];

  const visibleTools = TOOLS.filter((t) => {
    const roleOk = t.roles.includes(userRole);
    const searchOk =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.desc.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const catOk = catFilter === "All" || t.category === catFilter;
    return roleOk && searchOk && catOk;
  });

  const handleSelectTool = (tool) => {
    setActiveTool(tool);
    setResult("");
  };

  const handleRun = async (formData) => {
    if (!activeTool) return;
    setLoading(true);
    setResult("");
    try {
      const output = await runTool(activeTool.id, formData);
      setResult(output);
      notify("AI generation complete!", "success");
      // save to history
      setHistory((h) => [
        {
          id: Date.now(),
          title: activeTool.title,
          icon: activeTool.icon,
          accent: activeTool.accent,
          result: output,
          time: new Date().toLocaleTimeString(),
        },
        ...h.slice(0, 19),
      ]);
    } catch (e) {
      notify("Generation failed: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    notify("Copied to clipboard!", "success");
  };

  const handleRestore = (entry) => {
    const tool = TOOLS.find((t) => t.title === entry.title);
    if (tool) setActiveTool(tool);
    setResult(entry.result);
    setShowHistory(false);
  };

  const ActiveForm = activeTool ? FORM_MAP[activeTool.id] : null;

  return (
    <div className="at-root">
      {/* Ambient */}
      <div className="at-ambient">
        <div className="at-orb at-orb--1" />
        <div className="at-orb at-orb--2" />
        <div className="at-orb at-orb--3" />
        <div className="at-grid" />
      </div>

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />

      {/* ── Header ── */}
      <header className="at-header">
        <div className="at-header-inner">
          <button className="at-back-btn" onClick={() => navigate(-1)}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M12 7.5H3M7 3.5L3 7.5l4 4" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          <div className="at-header-brand">
            <span className="at-header-gem">⬡</span>
            <span className="at-header-title">IntelliRecruit</span>
            <span className="at-header-sep">/</span>
            <span className="at-header-sub">AI Tools</span>
          </div>

          <div className="at-header-right">
            <div className="at-gemini-badge">
              <span className="at-gemini-dot" />
              Google Gemini AI
            </div>
            {history.length > 0 && (
              <button
                className={`at-history-btn ${showHistory ? "at-history-btn--active" : ""}`}
                onClick={() => setShowHistory(!showHistory)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                History ({history.length})
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="at-body">
        {/* ── Left rail: tool selector ── */}
        <aside className="at-rail">
          <div className="at-rail-hero">
            <div className="at-rail-eyebrow">AI Features</div>
            <h1 className="at-rail-title">
              All Tools.<br />
              <em>One workspace.</em>
            </h1>
            <p className="at-rail-sub">
              Powered by Google Gemini — every generation is saved to your AI content log.
            </p>
          </div>

          {/* Search */}
          <div className="at-rail-search-wrap">
            <span className="at-rail-search-icon">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
                <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              className="at-rail-search"
              placeholder="Search tools…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <div className="at-cat-pills">
            {categories.map((c) => (
              <button
                key={c}
                className={`at-cat-pill ${catFilter === c ? "at-cat-pill--active" : ""}`}
                onClick={() => setCatFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Tool list */}
          <div className="at-tool-list">
            {visibleTools.map((tool) => (
              <button
                key={tool.id}
                className={`at-tool-item ${activeTool?.id === tool.id ? "at-tool-item--active" : ""}`}
                onClick={() => handleSelectTool(tool)}
                style={{ "--tool-accent": tool.accent, "--tool-accent-dim": tool.accentDim }}
              >
                <span className="at-tool-item-icon">{tool.icon}</span>
                <div className="at-tool-item-text">
                  <span className="at-tool-item-title">{tool.title}</span>
                  <span className="at-tool-item-cat">{tool.category}</span>
                </div>
                {tool.badge && (
                  <span className="at-tool-item-badge">{tool.badge}</span>
                )}
              </button>
            ))}

            {visibleTools.length === 0 && (
              <div className="at-rail-empty">
                <div className="at-rail-empty-icon">◈</div>
                <div className="at-rail-empty-text">No tools match your search</div>
              </div>
            )}
          </div>

          {/* User info */}
          <div className="at-rail-user">
            <div className="at-rail-user-avatar">{user?.name?.[0] || "U"}</div>
            <div className="at-rail-user-info">
              <div className="at-rail-user-name">{user?.name || "User"}</div>
              <div className="at-rail-user-role">{userRole}</div>
            </div>
          </div>
        </aside>

        {/* ── Main workspace ── */}
        <main className="at-workspace">

          {/* History panel */}
          {showHistory && history.length > 0 && (
            <div className="at-history-panel">
              <div className="at-history-header">
                <span className="at-history-header-title">Recent Generations</span>
                <button className="at-history-close" onClick={() => setShowHistory(false)}>✕</button>
              </div>
              <div className="at-history-list">
                {history.map((entry) => (
                  <HistoryEntry key={entry.id} entry={entry} onRestore={handleRestore} />
                ))}
              </div>
            </div>
          )}

          {!activeTool ? (
            /* ── Landing ── */
            <div className="at-landing">
              <div className="at-landing-icon-ring">
                {TOOLS.slice(0, 6).map((t, i) => (
                  <div
                    key={t.id}
                    className="at-landing-ring-dot"
                    style={{
                      "--angle": `${(i / 6) * 360}deg`,
                      "--accent": t.accent,
                      "--delay": `${i * 0.15}s`,
                    }}
                  >
                    <span>{t.icon}</span>
                  </div>
                ))}
                <div className="at-landing-ring-center">
                  <span className="at-landing-ring-gem">⬡</span>
                </div>
              </div>

              <h2 className="at-landing-title">Select an AI Tool</h2>
              <p className="at-landing-sub">
                Choose any tool from the left panel to open its workspace. All outputs are
                saved to your AI content log automatically.
              </p>

              <div className="at-landing-grid">
                {visibleTools.slice(0, 6).map((tool, i) => (
                  <button
                    key={tool.id}
                    className="at-landing-card"
                    onClick={() => handleSelectTool(tool)}
                    style={{
                      "--accent": tool.accent,
                      "--accent-dim": tool.accentDim,
                      "--delay": `${i * 0.08}s`,
                    }}
                  >
                    <div className="at-landing-card-icon">{tool.icon}</div>
                    <div className="at-landing-card-title">{tool.title}</div>
                    <div className="at-landing-card-cat">{tool.category}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Active tool workspace ── */
            <div className="at-active-workspace">
              {/* Tool header */}
              <div className="at-active-header" style={{ "--accent": activeTool.accent, "--accent-dim": activeTool.accentDim }}>
                <div className="at-active-header-left">
                  <div className="at-active-icon">{activeTool.icon}</div>
                  <div>
                    <div className="at-active-eyebrow">{activeTool.category}</div>
                    <h2 className="at-active-title">{activeTool.title}</h2>
                    <p className="at-active-tagline">{activeTool.tagline}</p>
                  </div>
                </div>
                <div className="at-active-header-right">
                  {activeTool.badge && (
                    <span className="at-active-badge" style={{ color: activeTool.accent, background: activeTool.accentDim, borderColor: `${activeTool.accent}33` }}>
                      {activeTool.badge}
                    </span>
                  )}
                  <div className="at-active-roles">
                    {activeTool.roles.map((r) => (
                      <span key={r} className="at-role-chip">{r}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="at-active-desc">{activeTool.desc}</div>

              {/* Two-column: form + result */}
              <div className="at-workspace-cols">
                <div className="at-form-col">
                  <div className="at-form-col-label">Configuration</div>
                  {ActiveForm && (
                    <ActiveForm onRun={handleRun} loading={loading} />
                  )}
                </div>

                <div className="at-result-col">
                  <div className="at-result-col-label">Output</div>
                  <ResultPane
                    result={result}
                    loading={loading}
                    onCopy={handleCopy}
                    onClear={() => setResult("")}
                  />
                  {!result && !loading && (
                    <div className="at-result-placeholder">
                      <div className="at-placeholder-icon">
                        {activeTool.icon}
                      </div>
                      <div className="at-placeholder-text">
                        Fill in the form and click Generate — your AI output will appear here.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}