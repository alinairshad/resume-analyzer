import { useEffect, useState } from "react";
import "./Landing.css";

function AnimatedGauge() {
  const [score, setScore] = useState(0);
  const target = 87;
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    const start = performance.now();
    const duration = 1600;
    let frame;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setScore(Math.round(eased * target));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="hero-gauge">
      <svg viewBox="0 0 200 200" className="hero-gauge-svg">
        <circle cx="100" cy="100" r={radius} className="hero-gauge-track" strokeWidth="10" fill="none" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          className="hero-gauge-fill"
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="hero-gauge-label">
        <span className="hero-gauge-score">{score}</span>
        <span className="hero-gauge-unit">% match</span>
      </div>
    </div>
  );
}

export default function Landing({ onGetStarted, onSignIn }) {
  return (
    <div className="landing">
      <header className="landing-topbar">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <span className="brand-name">ResumeAI</span>
        </div>
        <nav className="landing-nav">
          <button className="nav-link" onClick={onSignIn}>Sign In</button>
          <button className="nav-cta" onClick={onGetStarted}>Get Started</button>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="hero-eyebrow">DOCUMENT INTELLIGENCE · ATS SIMULATION</span>
          <h1 className="hero-title">
            Know if your resume<br />clears the filter <span className="accent">before</span> a recruiter sees it.
          </h1>
          <p className="hero-sub">
            Upload your resume and a job description. Get a match score, missing
            keywords, an ATS compatibility check, and AI feedback — in seconds.
          </p>
          <div className="hero-actions">
            <button className="hero-primary" onClick={onGetStarted}>Analyze My Resume</button>
            <span className="hero-note">No credit card · Takes ~10 seconds</span>
          </div>
        </div>

        <div className="hero-visual">
          <AnimatedGauge />
          <div className="hero-tags">
            <span className="hero-tag hero-tag-match">python</span>
            <span className="hero-tag hero-tag-match">git</span>
            <span className="hero-tag hero-tag-gap">docker</span>
          </div>
        </div>
      </section>

      <section className="how">
        <h2 className="how-title">How it works</h2>
        <div className="how-steps">
          <div className="how-step">
            <span className="how-index">01</span>
            <h3>Upload</h3>
            <p>Drop in your resume PDF and paste the job description you're targeting.</p>
          </div>
          <div className="how-step">
            <span className="how-index">02</span>
            <h3>Analyze</h3>
            <p>Our engine extracts skills, checks ATS formatting, and scores the match.</p>
          </div>
          <div className="how-step">
            <span className="how-index">03</span>
            <h3>Improve</h3>
            <p>Get specific, AI-written suggestions to close the gaps before you apply.</p>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <span className="feature-icon">◈</span>
          <h3>Match Scoring</h3>
          <p>See exactly how well your resume aligns with a specific job — not a generic score.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">▤</span>
          <h3>ATS Compatibility</h3>
          <p>Catch formatting issues that cause real applicant tracking systems to misread your resume.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">✦</span>
          <h3>AI Feedback</h3>
          <p>Actionable, specific suggestions — not vague advice — generated for your resume and role.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <span>ResumeAI · Built by Alina Irshad</span>
      </footer>
    </div>
  );
}
