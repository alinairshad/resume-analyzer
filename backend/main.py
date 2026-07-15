from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import io
from skills_data import SKILLS_DB
from ats_checker import check_ats_score

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_skills(text: str):
    text_lower = text.lower()
    found_skills = []
    for skill in SKILLS_DB:
        if skill in text_lower:
            found_skills.append(skill)
    return found_skills

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

@app.get("/")
def home():
    return {"message": "Resume Analyzer API is running"}

@app.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    # Resume text extract karo
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

    return {
        "filename": file.filename,
        "resume_skills": resume_skills,
        "jd_skills": jd_skills,
        "match_score": match_result["match_score"],
        "matched_skills": match_result["matched_skills"],
        "missing_skills": match_result["missing_skills"],
        "ats_score": ats_result["ats_score"],
        "ats_feedback": ats_result["feedback"]
    }