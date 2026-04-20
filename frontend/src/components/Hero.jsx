import UploadBox from "./UploadBox";

const stats = [
  { num: "99.2%", label: "OCR Accuracy"   },
  { num: "50ms",  label: "Avg. Response"  },
  { num: "12k+",  label: "Docs Processed" },
  { num: "40+",   label: "Languages"      },
];

const features = [
  {
    icon:       "🔍",
    colorClass: "feat-icon-purple",
    title:      "Smart OCR",
    desc:       "Tesseract-powered extraction with advanced preprocessing — denoising, thresholding, and deskewing.",
  },
  {
    icon:       "✦",
    colorClass: "feat-icon-blue",
    title:      "Grammar AI",
    desc:       "LanguageTool integration with deep grammar, style, and spelling correction across 40+ languages.",
  },
  {
    icon:       "⚡",
    colorClass: "feat-icon-pink",
    title:      "Instant Results",
    desc:       "Real-time processing pipeline — upload to result in under 500ms on typical documents.",
  },
];

export default function Hero() {
  return (
    <>
      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span className="live-dot" />
          OCR + Grammar AI · Live
        </div>

        <h1>
          Upload documents,<br />
          get <span className="grad">instant insights</span>
        </h1>

        <p>
          Extract text from any image and correct grammar using
          state-of-the-art OCR and AI — in seconds.
        </p>

        <div className="hero-btns">
          <button className="btn-primary">Start Free Trial</button>
          <button className="btn-secondary">Book a Demo</button>
        </div>
      </section>

      {/* ── Stats Row ──
          Each stat + its trailing divider are wrapped in ONE keyed div
          so React never sees a <> fragment as the map return value.      */}
      <div className="stats-row">
        {stats.map((s, i) => (
          <div key={s.label} className="stat-row-group">
            <div className="stat-item">
              <div className="stat-num">
                <span className="accent">{s.num}</span>
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
            {i < stats.length - 1 && <div className="stat-divider" />}
          </div>
        ))}
      </div>

      {/* ── Upload Box ── */}
      <UploadBox />

      {/* ── Feature Cards ── */}
      <div className="features-grid">
        {features.map((f) => (
          <div className="feat-card" key={f.title}>
            <div className={`feat-icon ${f.colorClass}`}>{f.icon}</div>
            <div className="feat-title">{f.title}</div>
            <div className="feat-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </>
  );
}
