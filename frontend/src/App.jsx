import { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file || !jobDescription.trim()) {
      setError('Please upload a resume and paste a job description.');
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);

    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to analyze resume. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">◆</span>
          <span>ResumeAI</span>
        </div>
        <p className="tagline">Smart resume analysis powered by NLP</p>
      </header>

      <div className="container">
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Resume (PDF)</label>
            <div className="file-input">
              <input type="file" accept=".pdf" onChange={handleFileChange} id="file-upload" />
              <label htmlFor="file-upload" className="file-label">
                {file ? file.name : 'Choose file...'}
              </label>
            </div>
          </div>

          <div className="field">
            <label>Job Description</label>
            <textarea
              rows="6"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {result && (
          <div className="results">
            <div className="score-grid">
              <div className="score-card">
                <p className="score-label">Match Score</p>
                <p className="score-value">{result.match_score}<span>%</span></p>
              </div>
              <div className="score-card">
                <p className="score-label">ATS Score</p>
                <p className="score-value">{result.ats_score}<span>%</span></p>
              </div>
            </div>

            <div className="skills-section">
              <h3>Matched Skills</h3>
              <div className="tags">
                {result.matched_skills.length > 0 ? (
                  result.matched_skills.map((skill) => (
                    <span key={skill} className="tag tag-green">{skill}</span>
                  ))
                ) : (
                  <p className="empty-state">None found.</p>
                )}
              </div>
            </div>

            <div className="skills-section">
              <h3>Missing Skills</h3>
              <div className="tags">
                {result.missing_skills.length > 0 ? (
                  result.missing_skills.map((skill) => (
                    <span key={skill} className="tag tag-red">{skill}</span>
                  ))
                ) : (
                  <p className="empty-state">None missing — great match!</p>
                )}
              </div>
            </div>

            {result.ats_feedback.length > 0 && (
              <div className="skills-section">
                <h3>ATS Feedback</h3>
                <ul className="feedback-list">
                  {result.ats_feedback.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;