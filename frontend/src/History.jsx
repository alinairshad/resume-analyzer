import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./History.css";

export default function History({ onClose, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error: fetchError } = await supabase
        .from("analyses")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError("Could not load history.");
      } else {
        setItems(data);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSelect = (row) => {
    onSelect({
      score: row.match_score,
      atsScore: row.ats_score,
      matched: row.matched_skills || [],
      missing: row.missing_skills || [],
      atsFeedback: row.ats_feedback || [],
      aiSummary: row.ai_summary,
    });
  };

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>Past Analyses</h2>
          <button className="history-close" onClick={onClose}>✕</button>
        </div>

        {loading && <p className="history-empty">Loading…</p>}
        {error && <p className="history-empty">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="history-empty">No analyses yet. Run one to see it here.</p>
        )}

        <div className="history-list">
          {items.map((row) => (
            <button
              key={row.id}
              className="history-item"
              onClick={() => handleSelect(row)}
            >
              <div className="history-item-top">
                <span className="history-item-name">{row.resume_name}</span>
                <span className="history-item-date">
                  {new Date(row.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="history-item-scores">
                <span className="history-score">{row.match_score}% match</span>
                <span className="history-score">{row.ats_score}/100 ATS</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}