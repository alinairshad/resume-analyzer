import { useEffect, useState } from "react";
import "./IntroLoader.css";

const STATUS = ["Reading document", "Extracting skills", "Ready"];
const CHIPS = ["python", "react", "sql", "docker", "aws"];
const LINE_ROWS = [92, 112, 128, 144, 160, 176, 196, 212, 228];

export default function IntroLoader({ onDone }) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      onDone();
      return;
    }

    const t1 = setTimeout(() => setStatusIndex(1), 900);
    const t2 = setTimeout(() => setStatusIndex(2), 1650);
    const t3 = setTimeout(() => setExiting(true), 2100);
    const t4 = setTimeout(() => onDone(), 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onDone]);

  return (
    <div className={`intro-loader ${exiting ? "intro-loader-exit" : ""}`}>
      <div className="intro-stage">
        <svg viewBox="0 0 220 280" className="intro-doc" aria-hidden="true">
          <defs>
            <linearGradient id="introScanGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" className="intro-scan-stop-edge" />
              <stop offset="50%" className="intro-scan-stop-core" />
              <stop offset="100%" className="intro-scan-stop-edge" />
            </linearGradient>
          </defs>

          <rect x="10" y="10" width="200" height="260" rx="10" className="intro-doc-fill" />
          <rect x="10" y="10" width="200" height="260" rx="10" className="intro-doc-outline" />

          <rect x="34" y="38" width="90" height="10" rx="3" className="intro-doc-name" />
          <rect x="34" y="56" width="60" height="6" rx="3" className="intro-doc-role" />

          {LINE_ROWS.map((y, i) => (
            <rect
              key={y}
              x="34"
              y={y}
              width={i % 3 === 2 ? 90 : 150}
              height="6"
              rx="3"
              className="intro-doc-line"
              style={{ animationDelay: `${0.55 + i * 0.07}s` }}
            />
          ))}

          <rect x="10" y="10" width="200" height="4" fill="url(#introScanGrad)" className="intro-scan" />
        </svg>
      </div>

      <p key={statusIndex} className={`intro-status ${statusIndex === 2 ? "intro-status-done" : ""}`}>
        {STATUS[statusIndex]}
      </p>

      <div className="intro-chips">
        {CHIPS.map((skill, i) => (
          <span key={skill} className="intro-chip" style={{ animationDelay: `${1.35 + i * 0.11}s` }}>
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}