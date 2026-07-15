# AI Resume Analyzer

An AI-powered tool that analyzes resumes against job descriptions — highlighting strengths, missing skills, and an ATS-friendliness score.

## Features

- Upload a resume (PDF) and get instant analysis
- Match score against a job description
- Missing skills detection
- ATS (Applicant Tracking System) compatibility score

## Tech stack

**Backend:** FastAPI, spaCy, PyMuPDF/pdfplumber
**Frontend:** React
**NLP:** spaCy (baseline), Hugging Face Transformers (advanced matching)

## Project structure

```
resume-analyzer/
├── backend/
│   ├── main.py
│   ├── routers/
│   ├── services/
│   └── requirements.txt
├── frontend/
│   ├── src/
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

## Roadmap

- [ ] PDF upload + text extraction
- [ ] Skill extraction with spaCy
- [ ] Job description matching / scoring logic
- [ ] ATS compatibility checks
- [ ] React dashboard for results
- [ ] Deployment (backend + frontend)

## License

MIT