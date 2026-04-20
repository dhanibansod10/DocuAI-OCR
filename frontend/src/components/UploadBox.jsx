import { useState, useCallback } from "react";

/* ── helpers ── */
function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function computeDiff(original, corrected) {
  const wordsA = original.split(/(\s+)/);
  const wordsB = corrected.split(/(\s+)/);
  const len = Math.max(wordsA.length, wordsB.length);
  let html = "";
  for (let i = 0; i < len; i++) {
    const wa = wordsA[i] ?? "";
    const wb = wordsB[i] ?? "";
    if (wa === wb) {
      html += escHtml(wb);
    } else {
      if (wa) html += `<span class="diff-del">${escHtml(wa)}</span>`;
      if (wb) html += `<span class="diff-add">${escHtml(wb)}</span>`;
    }
  }
  return html;
}

/* ── Toast sub-component ── */
function Toast({ message, visible }) {
  return (
    <div className={`toast${visible ? " show" : ""}`}>
      <div className="toast-dot" />
      <span>{message}</span>
    </div>
  );
}

/* ── Main Component ── */
export default function UploadBox() {
  const [file, setFile]                     = useState(null);
  const [dragOver, setDragOver]             = useState(false);
  const [ocrText, setOcrText]               = useState("");
  const [corrected, setCorrected]           = useState("");
  const [diffHtml, setDiffHtml]             = useState("");
  const [showDiff, setShowDiff]             = useState(false);
  const [ocrLoading, setOcrLoading]         = useState(false);
  const [correctLoading, setCorrectLoading] = useState(false);
  const [toast, setToast]                   = useState({ visible: false, message: "" });

  /* show toast for 2.8s */
  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: "" }), 2800);
  }, []);

  /* reset results whenever a new file is picked */
  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setOcrText("");
    setCorrected("");
    setDiffHtml("");
    setShowDiff(false);
  };

  /* drag handlers */
  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true);  };
  const handleDragLeave = ()  => setDragOver(false);
  const handleDrop      = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  /* ── OCR ── */
  const handleOCR = async () => {
    if (!file) return;
    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res  = await fetch("http://127.0.0.1:5000/ocr", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOcrText(data.text);
      showToast("Text extracted successfully!");
    } catch (err) {
      showToast("Error: " + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  /* ── Grammar Correction ── */
  const handleCorrect = async () => {
    const raw = ocrText.trim();
    if (!raw) return;
    setCorrectLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/correct", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text: raw }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCorrected(data.corrected_text);
      setDiffHtml(computeDiff(raw, data.corrected_text));
      showToast("Grammar corrected!");
    } catch (err) {
      showToast("Error: " + err.message);
    } finally {
      setCorrectLoading(false);
    }
  };

  /* ── Copy to clipboard ── */
  const handleCopy = () => {
    const txt = corrected || ocrText;
    if (!txt) return;
    navigator.clipboard
      .writeText(txt)
      .then(() => showToast("Copied to clipboard!"))
      .catch(() => showToast("Copy failed — try manually."));
  };

  return (
    <>
      <div className="upload-wrapper">
        <div className="glass-card">

          {/* ── Card Header ── */}
          <div className="card-header">
            <div className="card-header-icon">📄</div>
            <div className="card-header-text">
              <div className="title">Document Processor</div>
              <div className="subtitle">Upload · Extract · Correct</div>
            </div>
          </div>

          <div className="card-body">

            {/* ── Drop Zone ── */}
            <div
              className={`drop-box${dragOver ? " dragover" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              <div className="drop-icon">⬆</div>
              <div className="drop-title">Drop your document here</div>
              <div className="drop-subtitle">
                or <b>browse files</b> — PNG, JPG, PDF supported
              </div>
              {file && (
                <div className="file-selected show">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="#4ade80" strokeWidth="1.5" />
                    <path
                      d="M5 8l2 2 4-4"
                      stroke="#4ade80"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{file.name}</span>
                </div>
              )}
            </div>

            {/* ── Action Buttons ── */}
            <div className="actions">
              <button
                className={`btn-action btn-ocr${ocrLoading ? " loading" : ""}`}
                onClick={handleOCR}
                disabled={!file || ocrLoading}
              >
                <div className="spinner" />
                <span className="btn-label">⚡ Extract Text</span>
              </button>

              <button
                className={`btn-action btn-correct${correctLoading ? " loading" : ""}`}
                onClick={handleCorrect}
                disabled={!ocrText || correctLoading}
              >
                <div className="spinner" />
                <span className="btn-label">✦ Correct Grammar</span>
              </button>

              <button
                className="btn-action btn-copy"
                onClick={handleCopy}
                disabled={!ocrText}
              >
                <span className="btn-label">⎘ Copy</span>
              </button>
            </div>

            {/* ── Extracted Text ── */}
            {ocrText && (
              <div className="result-section show">
                <div className="result-label-row">
                  <div className="result-label">
                    <div className="dot dot-purple" />
                    Extracted Text
                  </div>
                  <span className="char-badge">{ocrText.length} chars</span>
                </div>
                <div className="result-box">
                  <textarea
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    rows={5}
                    placeholder="Extracted text will appear here…"
                  />
                  <div className="result-box-footer">
                    <span>Editable — refine before correcting</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Corrected Text ── */}
            {corrected && (
              <div className="result-section show">
                <div className="divider" />
                <div className="result-label-row">
                  <div className="result-label">
                    <div className="dot dot-blue" />
                    Corrected Text
                  </div>
                  <label className="diff-toggle">
                    <input
                      type="checkbox"
                      checked={showDiff}
                      onChange={(e) => setShowDiff(e.target.checked)}
                    />
                    Show diff
                  </label>
                </div>

                {!showDiff && (
                  <div className="result-box">
                    <textarea
                      value={corrected}
                      readOnly
                      rows={5}
                      placeholder="Corrected text will appear here…"
                    />
                    <div className="result-box-footer">
                      <span>Grammar &amp; spelling corrected</span>
                      <span className="char-badge">{corrected.length} chars</span>
                    </div>
                  </div>
                )}

                {showDiff && (
                  <div
                    className="diff-box show"
                    dangerouslySetInnerHTML={{ __html: diffHtml }}
                  />
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
