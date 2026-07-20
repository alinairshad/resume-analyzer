# ResumeAI

An AI-powered resume analysis tool that compares a resume against a job description — highlighting skill matches, gaps, ATS compatibility, and AI-generated improvement suggestions.

## Features

- **Resume vs Job Match Scoring** — see exactly how well a resume aligns with a specific job description
- **ATS Compatibility Score** — catches formatting issues that cause real applicant tracking systems to misread a resume
- **Matched & Missing Skills** — extracted and compared automatically
- **AI Feedback** — specific, actionable suggestions generated for the resume and role
- **PDF Report Export** — download the full analysis as a PDF
- **Resume Preview** — preview the uploaded PDF inline before running analysis
- **Auth & History** — sign up/sign in (Supabase), with past analyses saved and viewable anytime

## Tech stack

**Backend:** FastAPI, spaCy, PyMuPDF/pdfplumber
**Frontend:** React, jsPDF
**Auth & Database:** Supabase (Postgres + Row Level Security)
**NLP:** spaCy (baseline), Hugging Face Transformers (advanced matching)

## Project structure

```
resume-analyzer/
├── backend/
│   ├── main.py
│   ├── ai_feedback.py
│   ├── routers/
│   ├── services/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main analyzer page
│   │   ├── Landing.jsx      # Landing page
│   │   ├── Auth.jsx         # Sign in / sign up
│   │   ├── History.jsx      # Past analyses view
│   │   ├── IntroLoader.jsx  # Boot animation
│   │   └── supabaseClient.js
│   └── package.json
├── .gitignore
└── README.md
```

## Getting started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

You'll need a `.env` file in `frontend/` with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_anon_key
```

## Roadmap

- [x] PDF upload + text extraction
- [x] Skill extraction with spaCy
- [x] Job description matching / scoring logic
- [x] ATS compatibility checks
- [x] React dashboard for results
- [x] AI-generated feedback
- [x] Auth + resume history (Supabase)
- [x] PDF report export
- [x] Resume preview
- [ ] Deployment (backend + frontend)

## License

MIT
