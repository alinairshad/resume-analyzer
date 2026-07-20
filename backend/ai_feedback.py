import os 
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def generate_ai_feedback(resume_text: str, job_description: str, matched_skills: list, missing_skills: list):
    prompt = f"""You are a professional resume reviewer. Based on the following resume and job description, give:
1. A 2-3 sentence summary of the candidate's strengths
2. 2-3 specific, actionable suggestions to improve the resume for this job

Matched skills: {', '.join(matched_skills)}
Missing skills: {','.join(missing_skills)}

Job description: {job_description[:1000]}

Resume text: {resume_text[:2000]}

Keep the response concise and structured with clear headings."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=400,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"AI feedback unavailable right now: {str(e)}"