import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import Landing from "./Landing.jsx";
import IntroLoader from "./IntroLoader.jsx";
import Auth from "./Auth.jsx";
import History from "./History.jsx";
import { supabase } from "./supabaseClient";
import "./App.css";

// Point this to your backend. Change if you deploy later.
const API_BASE = "http://127.0.0.1:8000";

async function analyzeResume(resumeFile, jobText) {
  const formData = new FormData();
  formData.append("file", resumeFile);
  formData.append("job_description", jobText);

  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }

  const data = await res.json();

  return {
    score: data.match_score,
    matched: data.matched_skills,
    missing: data.missing_skills,
    atsScore: data.ats_score,
    atsFeedback: data.ats_feedback,
    aiSummary: data.ai_summary,
  };
}

function ScoreGauge({ score }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="gauge">
      <svg viewBox="0 0 180 180" className="gauge-svg">
        <circle
          cx="90"
          cy="90"
          r={radius}
          className="gauge-track"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          className="gauge-fill"
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="gauge-label">
        <span className="gauge-score">{score}</span>
        <span className="gauge-unit">% match</span>
      </div>
    </div>
  );
}

function AnalyzerPage({ onBackToHome, onSignOut, userEmail }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobText, setJobText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | analyzing | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  // Clean up the object URL when it changes or the component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (file) => {
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!resumeFile || !jobText.trim()) return;
    setStatus("analyzing");
    setResult(null);
    setErrorMsg("");
    try {
      const data = await analyzeResume(resumeFile, jobText);
      setResult(data);
      setStatus("done");

      // Save to history (non-blocking — if it fails, don't break the UI)
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          await supabase.from("analyses").insert({
            user_id: userData.user.id,
            resume_name: resumeFile.name,
            job_description: jobText,
            match_score: data.score,
            ats_score: data.atsScore,
            matched_skills: data.matched,
            missing_skills: data.missing,
            ats_feedback: data.atsFeedback,
            ai_summary: data.aiSummary || null,
          });
        }
      } catch (saveErr) {
        console.error("Failed to save to history:", saveErr);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Analysis failed. Make sure the backend server is running.");
      setStatus("error");
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;

    const doc = new jsPDF();
    const marginX = 20;
    let y = 20;

    doc.setFontSize(20);
    doc.text("ResumeAI — Analysis Report", marginX, y);
    y += 12;

    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, marginX, y);
    y += 14;

    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text(`Match Score: ${result.score}%`, marginX, y);
    y += 8;
    doc.text(`ATS Score: ${result.atsScore}/100`, marginX, y);
    y += 14;

    doc.setFontSize(12);
    doc.text("Matched Skills:", marginX, y);
    y += 7;
    doc.setFontSize(10);
    const matchedText = result.matched.length ? result.matched.join(", ") : "None found.";
    const matchedLines = doc.splitTextToSize(matchedText, 170);
    doc.text(matchedLines, marginX, y);
    y += matchedLines.length * 6 + 8;

    doc.setFontSize(12);
    doc.text("Missing Skills:", marginX, y);
    y += 7;
    doc.setFontSize(10);
    const missingText = result.missing.length ? result.missing.join(", ") : "None missing.";
    const missingLines = doc.splitTextToSize(missingText, 170);
    doc.text(missingLines, marginX, y);
    y += missingLines.length * 6 + 8;

    if (result.atsFeedback && result.atsFeedback.length > 0) {
      doc.setFontSize(12);
      doc.text("ATS Feedback:", marginX, y);
      y += 7;
      doc.setFontSize(10);
      result.atsFeedback.forEach((tip) => {
        const lines = doc.splitTextToSize(`• ${tip}`, 170);
        doc.text(lines, marginX, y);
        y += lines.length * 6 + 2;
      });
      y += 6;
    }

    if (result.aiSummary) {
      doc.setFontSize(12);
      doc.text("AI Feedback:", marginX, y);
      y += 7;
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(result.aiSummary, 170);
      doc.text(summaryLines, marginX, y);
    }

    doc.save("resume-analysis-report.pdf");
  };

  const canAnalyze = resumeFile && jobText.trim().length > 0 && status !== "analyzing";

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={onBackToHome} style={{ cursor: "pointer" }}>
          <span className="brand-mark">◆</span>
          <span className="brand-name">ResumeAI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="brand-tag">DOCUMENT INTELLIGENCE · ATS SIMULATION</span>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            History
          </button>
          {userEmail && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
              {userEmail}
            </span>
          )}
          <button
            onClick={onSignOut}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="layout">
        {/* LEFT — INPUT */}
        <section className="panel input-panel">
          <div className="panel-head">
            <span className="panel-index">01</span>
            <h2>Source Documents</h2>
          </div>

          <label className="field-label">Resume</label>
          <div
            className={`dropzone ${dragActive ? "drag" : ""} ${resumeFile ? "filled" : ""}`}
            onClick={() => inputRef.current.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {resumeFile ? (
              <div className="dropzone-filled">
                <span className="file-icon">▤</span>
                <div>
                  <p className="file-name">{resumeFile.name}</p>
                  <p className="file-meta">{(resumeFile.size / 1024).toFixed(0)} KB · click to replace</p>
                </div>
                <button
                  type="button"
                  className="preview-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPreview(true);
                  }}
                >
                  Preview
                </button>
              </div>
            ) : (
              <div className="dropzone-empty">
                <span className="file-icon dim">▤</span>
                <p>Drop your resume here</p>
                <p className="dropzone-hint">PDF, up to 10MB</p>
              </div>
            )}
          </div>

          <label className="field-label">Job Description</label>
          <textarea
            className="job-textarea"
            placeholder="Paste the job description here…"
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
          />

          <button
            className="analyze-btn"
            disabled={!canAnalyze}
            onClick={handleAnalyze}
          >
            {status === "analyzing" ? "Analyzing…" : "Run Analysis"}
          </button>

          {status === "error" && (
            <p style={{ color: "#f5a623", fontSize: 13, marginTop: 12 }}>{errorMsg}</p>
          )}
        </section>

        {/* RIGHT — OUTPUT */}
        <section className="panel output-panel">
          <div className="panel-head">
            <span className="panel-index">02</span>
            <h2>Analysis</h2>
          </div>

          {status === "idle" && (
            <div className="empty-state">
              <span className="empty-icon">◇</span>
              <p>Upload a resume and job description to begin.</p>
            </div>
          )}

          {status === "analyzing" && (
            <div className="scanning">
              <div className="scan-doc">
                <div className="scan-line" />
                {Array.from({ length: 7 }).map((_, i) => (
                  <div className="scan-row" key={i} style={{ width: `${60 + (i * 7) % 35}%` }} />
                ))}
              </div>
              <p className="scanning-label">Parsing document structure…</p>
            </div>
          )}

          {status === "done" && result && (
            <div className="results">
              <ScoreGauge score={result.score} />

              <button className="download-report-btn" onClick={handleDownloadReport}>
                ⬇ Download Report (PDF)
              </button>

              <div className="tag-group">
                <p className="tag-group-label">Matched keywords</p>
                <div className="tags">
                  {result.matched.map((k) => (
                    <span className="tag tag-match" key={k}>{k}</span>
                  ))}
                </div>
              </div>

              <div className="tag-group">
                <p className="tag-group-label">Missing from resume</p>
                <div className="tags">
                  {result.missing.map((k) => (
                    <span className="tag tag-gap" key={k}>{k}</span>
                  ))}
                </div>
              </div>

              <div className="tag-group">
                <p className="tag-group-label">ATS Score: {result.atsScore}/100</p>
                <ul style={{ color: "var(--text-muted)", fontSize: 13, paddingLeft: 18, margin: 0 }}>
                  {result.atsFeedback.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              {result.aiSummary && (
                <div className="tag-group">
                  <p className="tag-group-label">AI Feedback</p>
                  <p style={{ color: "var(--text)", fontSize: 13, whiteSpace: "pre-wrap" }}>
                    {result.aiSummary}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {showHistory && (
        <History
          onClose={() => setShowHistory(false)}
          onSelect={(pastResult) => {
            setResult(pastResult);
            setStatus("done");
            setShowHistory(false);
          }}
        />
      )}

      {showPreview && previewUrl && (
        <div className="preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-panel" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h2>{resumeFile?.name}</h2>
              <button className="preview-close" onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <iframe src={previewUrl} title="Resume preview" className="preview-frame" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState("landing"); // landing | auth | app
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // If a logged-in session already exists (e.g. page refresh), skip straight to the app.
  useEffect(() => {
    if (authChecked && session && view === "landing") {
      setView("app");
    }
  }, [authChecked, session]);

  const goToAppOrAuth = () => {
    setView(session ? "app" : "auth");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setView("landing");
  };

  if (booting) {
    return <IntroLoader onDone={() => setBooting(false)} />;
  }

  if (view === "auth") {
    return <Auth onAuthed={() => setView("app")} onBack={() => setView("landing")} />;
  }

  if (view === "app" && session) {
    return (
      <AnalyzerPage
        onBackToHome={() => setView("landing")}
        onSignOut={handleSignOut}
        userEmail={session.user?.email}
      />
    );
  }

  return <Landing onGetStarted={goToAppOrAuth} onSignIn={goToAppOrAuth} />;
}