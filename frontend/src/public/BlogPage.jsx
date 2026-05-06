import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./BlogPage.css";

/* ─────────────────────────────────────────
   API Helper
───────────────────────────────────────── */
import api from "../services/api";

async function fetchPosts() {
  const res = await api.get("/blog");
  return res.data;
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function readingTime(content = "") {
  const words = content.replace(/[#*`]/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function stripMarkdown(md = "") {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
}

/* Parse markdown into renderable blocks */
function parseMarkdown(md = "") {
  const lines = md.split("\n");
  const blocks = [];
  let listItems = [];
  let inList = false;

  const flushList = () => {
    if (listItems.length) {
      blocks.push({ type: "ul", items: [...listItems] });
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line) => {
    if (/^#{1}\s/.test(line)) {
      flushList();
      blocks.push({ type: "h1", text: line.replace(/^#\s/, "") });
    } else if (/^#{2}\s/.test(line)) {
      flushList();
      blocks.push({ type: "h2", text: line.replace(/^##\s/, "") });
    } else if (/^#{3}\s/.test(line)) {
      flushList();
      blocks.push({ type: "h3", text: line.replace(/^###\s/, "") });
    } else if (/^[-*]\s/.test(line)) {
      inList = true;
      listItems.push(line.replace(/^[-*]\s/, ""));
    } else if (/^\d+\.\s/.test(line)) {
      flushList();
      blocks.push({ type: "ol-item", text: line.replace(/^\d+\.\s/, "") });
    } else if (line.trim() === "") {
      flushList();
      blocks.push({ type: "spacer" });
    } else {
      flushList();
      blocks.push({ type: "p", text: line });
    }
  });

  flushList();
  return blocks;
}

function renderInline(text = "") {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^`[^`]+`$/.test(part))
      return <code key={i} className="bp-code-inline">{part.slice(1, -1)}</code>;
    return part;
  });
}

/* ─────────────────────────────────────────
   Post Modal / Reader
───────────────────────────────────────── */
function PostReader({ post, onClose }) {
  const scrollRef = useRef(null);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setScrollPct(Math.min(1, Math.max(0, pct)));
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const blocks = parseMarkdown(post.content);
  const mins = readingTime(post.content);

  /* Collect h2/h3 headings for table of contents */
  const headings = blocks.filter((b) => b.type === "h2" || b.type === "h3");

  return (
    <div className="bp-reader-overlay" onClick={onClose}>
      {/* Reading progress bar */}
      <div
        className="bp-read-progress"
        style={{ transform: `scaleX(${scrollPct})` }}
      />

      <div
        className="bp-reader"
        onClick={(e) => e.stopPropagation()}
        ref={scrollRef}
      >
        {/* Reader header */}
        <div className="bp-reader-topbar">
          <div className="bp-reader-topbar-left">
            <span className="bp-reader-brand">
              <span className="bp-brand-gem">⬡</span> IntelliRecruit
            </span>
            <span className="bp-reader-sep">·</span>
            <span className="bp-reader-mins">{mins} min read</span>
          </div>
          <button className="bp-reader-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="bp-reader-inner">
          {/* Table of contents */}
          {headings.length > 2 && (
            <aside className="bp-toc">
              <div className="bp-toc-label">Contents</div>
              {headings.map((h, i) => (
                <div
                  key={i}
                  className={`bp-toc-item ${h.type === "h3" ? "bp-toc-item--sub" : ""}`}
                >
                  {h.text}
                </div>
              ))}
            </aside>
          )}

          {/* Article */}
          <article className="bp-article">
            {/* Meta */}
            <div className="bp-article-meta">
              <span className="bp-article-category">Recruitment Insights</span>
              <div className="bp-article-details">
                <span className="bp-article-author">
                  By {post.authorName || "IntelliRecruit Team"}
                </span>
                {post.publishedAt && (
                  <>
                    <span className="bp-article-dot">·</span>
                    <span className="bp-article-date">
                      {formatDate(post.publishedAt)}
                    </span>
                  </>
                )}
                <span className="bp-article-dot">·</span>
                <span className="bp-article-mins">{mins} min read</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="bp-article-title">{post.title}</h1>

            {/* Decorative rule */}
            <div className="bp-article-rule">
              <span className="bp-rule-gem">⬡</span>
            </div>

            {/* Body */}
            <div className="bp-article-body">
              {blocks.map((block, idx) => {
                if (block.type === "h1")
                  return <h2 key={idx} className="bp-body-h1">{renderInline(block.text)}</h2>;
                if (block.type === "h2")
                  return <h2 key={idx} className="bp-body-h2">{renderInline(block.text)}</h2>;
                if (block.type === "h3")
                  return <h3 key={idx} className="bp-body-h3">{renderInline(block.text)}</h3>;
                if (block.type === "p")
                  return <p key={idx} className="bp-body-p">{renderInline(block.text)}</p>;
                if (block.type === "ul")
                  return (
                    <ul key={idx} className="bp-body-ul">
                      {block.items.map((item, ii) => (
                        <li key={ii}>{renderInline(item)}</li>
                      ))}
                    </ul>
                  );
                if (block.type === "ol-item")
                  return (
                    <div key={idx} className="bp-body-ol-item">
                      <span className="bp-ol-num">{idx + 1}</span>
                      <span>{renderInline(block.text)}</span>
                    </div>
                  );
                if (block.type === "spacer")
                  return <div key={idx} className="bp-body-spacer" />;
                return null;
              })}
            </div>

            {/* Footer */}
            <div className="bp-article-footer">
              <div className="bp-footer-rule" />
              <div className="bp-footer-cta">
                <span className="bp-footer-gem">⬡</span>
                <div>
                  <div className="bp-footer-cta-title">
                    Powered by IntelliRecruit AI
                  </div>
                  <div className="bp-footer-cta-sub">
                    This article was crafted with Google Gemini AI — our platform's
                    built-in blog generator helps agencies create expert content in seconds.
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Featured Card (large)
───────────────────────────────────────── */
function FeaturedCard({ post, onClick }) {
  const excerpt = stripMarkdown(post.content).slice(0, 220);
  const mins = readingTime(post.content);

  return (
    <div className="bp-featured-card" onClick={onClick}>
      <div className="bp-featured-artwork">
        <div className="bp-artwork-inner">
          <div className="bp-artwork-geo">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="100,12 188,56 188,144 100,188 12,144 12,56"
                stroke="rgba(201,168,76,0.25)" strokeWidth="1" fill="none"/>
              <polygon points="100,30 168,65 168,135 100,170 32,135 32,65"
                stroke="rgba(201,168,76,0.15)" strokeWidth="1" fill="none"/>
              <polygon points="100,48 148,74 148,126 100,152 52,126 52,74"
                stroke="rgba(201,168,76,0.1)" strokeWidth="1" fill="none"/>
              <circle cx="100" cy="100" r="30"
                stroke="rgba(45,212,191,0.15)" strokeWidth="1" fill="none"/>
              <circle cx="100" cy="100" r="15"
                stroke="rgba(45,212,191,0.2)" strokeWidth="1" fill="none"/>
              <circle cx="100" cy="100" r="5"
                fill="rgba(201,168,76,0.5)"/>
            </svg>
          </div>
          <div className="bp-artwork-label">Featured</div>
        </div>
      </div>

      <div className="bp-featured-body">
        <div className="bp-featured-meta">
          <span className="bp-cat-tag">Recruitment Insights</span>
          <span className="bp-read-tag">{mins} min read</span>
        </div>

        <h2 className="bp-featured-title">{post.title}</h2>

        <p className="bp-featured-excerpt">
          {excerpt}{excerpt.length >= 220 ? "…" : ""}
        </p>

        <div className="bp-featured-footer">
          <div className="bp-author-row">
            <div className="bp-author-avatar">
              {(post.authorName || "I")[0]}
            </div>
            <div>
              <div className="bp-author-name">
                {post.authorName || "IntelliRecruit Team"}
              </div>
              {post.publishedAt && (
                <div className="bp-author-date">{formatDate(post.publishedAt)}</div>
              )}
            </div>
          </div>
          <button className="bp-read-btn">
            Read Article
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Standard Card
───────────────────────────────────────── */
function PostCard({ post, index, onClick }) {
  const excerpt = stripMarkdown(post.content).slice(0, 140);
  const mins = readingTime(post.content);

  const patternColors = [
    { bg: "rgba(45,212,191,0.06)",  stroke: "rgba(45,212,191,0.2)"  },
    { bg: "rgba(201,168,76,0.06)",  stroke: "rgba(201,168,76,0.2)"  },
    { bg: "rgba(96,165,250,0.06)",  stroke: "rgba(96,165,250,0.2)"  },
    { bg: "rgba(232,121,249,0.06)", stroke: "rgba(232,121,249,0.2)" },
    { bg: "rgba(34,197,94,0.06)",   stroke: "rgba(34,197,94,0.2)"   },
    { bg: "rgba(249,115,22,0.06)",  stroke: "rgba(249,115,22,0.2)"  },
  ];
  const pat = patternColors[index % patternColors.length];

  return (
    <div
      className="bp-post-card"
      onClick={onClick}
      style={{
        "--card-bg": pat.bg,
        "--card-stroke": pat.stroke,
        "--card-delay": `${index * 60}ms`,
      }}
    >
      <div className="bp-post-card-thumb">
        <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="80" height="60" fill={pat.bg}/>
          <line x1="0" y1="30" x2="80" y2="30" stroke={pat.stroke} strokeWidth="0.5"/>
          <line x1="40" y1="0" x2="40" y2="60" stroke={pat.stroke} strokeWidth="0.5"/>
          <circle cx="40" cy="30" r="12" stroke={pat.stroke} strokeWidth="1" fill="none"/>
          <circle cx="40" cy="30" r="5" stroke={pat.stroke} strokeWidth="1" fill="none"/>
          <circle cx="40" cy="30" r="2" fill={pat.stroke}/>
        </svg>
      </div>

      <div className="bp-post-card-body">
        <div className="bp-post-card-top">
          <span className="bp-post-mins">{mins} min</span>
          {post.publishedAt && (
            <span className="bp-post-date">
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric",
              })}
            </span>
          )}
        </div>

        <h3 className="bp-post-title">{post.title}</h3>

        <p className="bp-post-excerpt">
          {excerpt}{excerpt.length >= 140 ? "…" : ""}
        </p>

        <div className="bp-post-footer">
          <div className="bp-post-author">
            <div className="bp-post-avatar">
              {(post.authorName || "I")[0]}
            </div>
            <span className="bp-post-author-name">
              {post.authorName || "IntelliRecruit"}
            </span>
          </div>
          <span className="bp-post-arrow">→</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Skeleton
───────────────────────────────────────── */
function SkeletonCard({ large }) {
  return (
    <div className={`bp-skeleton ${large ? "bp-skeleton--large" : ""}`}>
      <div className="bp-skeleton-thumb" />
      <div className="bp-skeleton-body">
        <div className="bp-skeleton-line bp-skeleton-line--short" />
        <div className="bp-skeleton-line bp-skeleton-line--full" />
        <div className="bp-skeleton-line bp-skeleton-line--full" />
        <div className="bp-skeleton-line bp-skeleton-line--med" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function BlogPage() {
  const navigate = useNavigate();
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    stripMarkdown(p.content).toLowerCase().includes(search.toLowerCase()) ||
    (p.authorName || "").toLowerCase().includes(search.toLowerCase())
  );

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="bp-root">
      {/* Ambient */}
      <div className="bp-ambient">
        <div className="bp-orb bp-orb--1" />
        <div className="bp-orb bp-orb--2" />
        <div className="bp-orb bp-orb--3" />
        <div className="bp-grid" />
      </div>

      {/* ── Navbar ── */}
      <nav className={`bp-nav ${scrolled ? "bp-nav--scrolled" : ""}`}>
        <div className="bp-nav-inner">
          <button className="bp-nav-brand" onClick={() => navigate("/")}>
            <span className="bp-nav-gem">⬡</span>
            <span className="bp-nav-name">IntelliRecruit</span>
          </button>

          <div className="bp-nav-links">
            <button className="bp-nav-link" onClick={() => navigate("/")}>Home</button>
            <button className="bp-nav-link bp-nav-link--active">Blog</button>
          </div>

          <div className="bp-nav-right">
            {isLoggedIn ? (
              <button
                className="bp-nav-cta"
                onClick={() => {
                  const role = user?.role;
                  if (role === "ADMIN") navigate("/admin/dashboard");
                  else if (role === "EMPLOYER") navigate("/employer/dashboard");
                  else navigate("/candidate/dashboard");
                }}
              >
                Dashboard →
              </button>
            ) : (
              <>
                <button className="bp-nav-ghost" onClick={() => navigate("/login")}>Sign In</button>
                <button className="bp-nav-cta" onClick={() => navigate("/register")}>Get Started</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bp-hero" ref={heroRef}>
        <div className="bp-hero-inner">
          <div className="bp-hero-eyebrow">
            <span className="bp-eyebrow-dot" />
            Recruitment Intelligence
          </div>
          <h1 className="bp-hero-title">
            The <em>IntelliRecruit</em><br />
            Journal
          </h1>
          <p className="bp-hero-sub">
            Expert insights on AI-powered hiring, talent strategy, and the future of
            recruitment — crafted by Gemini and curated for HR leaders.
          </p>

          {/* Search */}
          <div className="bp-hero-search">
            <span className="bp-hero-search-icon">
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 12l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              className="bp-hero-search-input"
              placeholder="Search articles, topics, authors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="bp-hero-search-clear" onClick={() => setSearch("")}>
                ✕
              </button>
            )}
          </div>

          {/* Stats strip */}
          {!loading && (
            <div className="bp-hero-stats">
              <div className="bp-hero-stat">
                <span className="bp-hero-stat-num">{posts.length}</span>
                <span className="bp-hero-stat-label">Articles</span>
              </div>
              <div className="bp-hero-stat-div" />
              <div className="bp-hero-stat">
                <span className="bp-hero-stat-num">AI</span>
                <span className="bp-hero-stat-label">Powered</span>
              </div>
              <div className="bp-hero-stat-div" />
              <div className="bp-hero-stat">
                <span className="bp-hero-stat-num">Free</span>
                <span className="bp-hero-stat-label">To Read</span>
              </div>
            </div>
          )}
        </div>

        {/* Decorative hex cluster */}
        <div className="bp-hero-deco">
          <div className="bp-deco-hex bp-deco-hex--1">⬡</div>
          <div className="bp-deco-hex bp-deco-hex--2">⬡</div>
          <div className="bp-deco-hex bp-deco-hex--3">⬡</div>
          <div className="bp-deco-hex bp-deco-hex--4">⬡</div>
          <div className="bp-deco-hex bp-deco-hex--5">⬡</div>
        </div>
      </section>

      {/* ── Content ── */}
      <main className="bp-main">
        <div className="bp-main-inner">

          {/* Error */}
          {error && (
            <div className="bp-error">
              <div className="bp-error-icon">⚠</div>
              <div className="bp-error-text">{error}</div>
              <button
                className="bp-retry-btn"
                onClick={() => {
                  setError("");
                  setLoading(true);
                  fetchPosts().then(setPosts).catch((e) => setError(e.message)).finally(() => setLoading(false));
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <>
              <SkeletonCard large />
              <div className="bp-grid-label">More Articles</div>
              <div className="bp-posts-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
              </div>
            </>
          )}

          {/* No results */}
          {!loading && !error && filtered.length === 0 && (
            <div className="bp-empty">
              <div className="bp-empty-gem">⬡</div>
              <h3 className="bp-empty-title">No articles found</h3>
              <p className="bp-empty-sub">
                {search
                  ? `No articles match "${search}" — try a different keyword.`
                  : "No published articles yet. Check back soon!"}
              </p>
              {search && (
                <button className="bp-retry-btn" onClick={() => setSearch("")}>
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* Featured post */}
          {!loading && !error && featured && (
            <>
              <div className="bp-section-label">
                <span className="bp-section-line" />
                <span>Featured Article</span>
                <span className="bp-section-line" />
              </div>

              <FeaturedCard
                post={featured}
                onClick={() => setSelected(featured)}
              />
            </>
          )}

          {/* Rest of posts */}
          {!loading && !error && rest.length > 0 && (
            <>
              <div className="bp-section-label" style={{ marginTop: 56 }}>
                <span className="bp-section-line" />
                <span>
                  {search ? `Results (${rest.length + 1})` : "More Articles"}
                </span>
                <span className="bp-section-line" />
              </div>

              <div className="bp-posts-grid">
                {rest.map((post, i) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={i}
                    onClick={() => setSelected(post)}
                  />
                ))}
              </div>
            </>
          )}

          {/* CTA banner */}
          {!loading && !error && (
            <div className="bp-cta-banner">
              <div className="bp-cta-glow" />
              <div className="bp-cta-content">
                <div className="bp-cta-gem">⬡</div>
                <h3 className="bp-cta-title">
                  Create content like this <em>in seconds</em>
                </h3>
                <p className="bp-cta-sub">
                  IntelliRecruit's built-in AI Blog Generator lets your agency
                  publish expert articles with one click — powered by Google Gemini.
                </p>
                <div className="bp-cta-actions">
                  <button className="bp-cta-primary" onClick={() => navigate("/register")}>
                    Start Free Today →
                  </button>
                  <button className="bp-cta-ghost" onClick={() => navigate("/login")}>
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bp-footer">
        <div className="bp-footer-inner">
          <div className="bp-footer-brand">
            <span className="bp-nav-gem">⬡</span>
            <span className="bp-footer-name">IntelliRecruit</span>
          </div>
          <div className="bp-footer-links">
            <button className="bp-footer-link" onClick={() => navigate("/")}>Home</button>
            <button className="bp-footer-link" onClick={() => navigate("/register")}>Register</button>
            <button className="bp-footer-link" onClick={() => navigate("/login")}>Sign In</button>
          </div>
          <div className="bp-footer-copy">
            © 2025 IntelliRecruit · AI-Powered Recruitment Platform
          </div>
        </div>
      </footer>

      {/* ── Post Reader Modal ── */}
      {selected && (
        <PostReader post={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}