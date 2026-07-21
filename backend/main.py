from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import io
import spacy
from spacy.matcher import PhraseMatcher
from skills_data import SKILLS_DB
from ats_checker import check_ats_score
from ai_feedback import generate_ai_feedback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

nlp = spacy.load("en_core_web_sm")

matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
skill_patterns = [nlp.make_doc(skill) for skill in SKILLS_DB]
matcher.add("SKILLS", skill_patterns)


def extract_skills(text: str):
    doc = nlp(text)
    matches = matcher(doc)
    found_skills = set()
    for match_id, start, end in matches:
        span = doc[start:end]
        found_skills.add(span.text.lower())
    return list(found_skills)


def calculate_match(resume_skills, jd_skills):
    resume_set = set(resume_skills)
    jd_set = set(jd_skills)

    matched = resume_set.intersection(jd_set)
    missing = jd_set - resume_set

    if len(jd_set) == 0:
        match_score = 0
    else:
        match_score = round((len(matched) / len(jd_set)) * 100, 2)

    return {
        "match_score": match_score,
        "matched_skills": list(matched),
        "missing_skills": list(missing)
    }


def build_heatmap(resume_text: str, jd_skills: list):
    jd_skills_lower = set(s.lower() for s in jd_skills)
    lines = [line.strip() for line in resume_text.split("\n") if line.strip()]

    heatmap_lines = []
    for line in lines:
        line_doc = nlp(line)
        line_matches = matcher(line_doc)
        matched_in_line = set()
        for match_id, start, end in line_matches:
            span = line_doc[start:end]
            skill = span.text.lower()
            if skill in jd_skills_lower:
                matched_in_line.add(skill)

        heatmap_lines.append({
            "text": line,
            "keyword_count": len(matched_in_line),
            "keywords": list(matched_in_line)
        })

    return heatmap_lines


@app.get("/")
def home():
    return {"message": "Resume Analyzer API is running"}


@app.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    pdf_bytes = await file.read()
    extracted_text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"

    resume_skills = extract_skills(extracted_text)
    jd_skills = extract_skills(job_description)
    match_result = calculate_match(resume_skills, jd_skills)
    ats_result = check_ats_score(extracted_text)
    ai_summary = generate_ai_feedback(extracted_text, job_description, match_result["matched_skills"], match_result["missing_skills"])
    heatmap_lines = build_heatmap(extracted_text, jd_skills)

    return {
        "filename": file.filename,
        "resume_skills": resume_skills,
        "jd_skills": jd_skills,
        "match_score": match_result["match_score"],
        "matched_skills": match_result["matched_skills"],
        "missing_skills": match_result["missing_skills"],
        "ats_score": ats_result["ats_score"],
        "ats_feedback": ats_result["feedback"],
        "ai_summary": ai_summary,
        "heatmap_lines": heatmap_lines
    }