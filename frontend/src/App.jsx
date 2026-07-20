import { useState, useRef, useEffect } from "react";
import Landing from "./Landing.jsx";
import IntroLoader from "./IntroLoader.jsx";
import Auth from "./Auth.jsx";
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
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
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
    } catch (err) {
      console.error(err);
      setErrorMsg("Analysis failed. Make sure the backend server is running.");
      setStatus("error");
    }
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