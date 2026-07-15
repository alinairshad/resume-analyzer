import re

def check_ats_score(text: str):
    score = 0
    max_score = 100
    feedback = []

    # 1. Email check (20 points)
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    if re.search(email_pattern, text):
        score += 20
    else:
        feedback.append("Email address not found — make sure it's clearly visible.")

    # 2. Phone number check (15 points)
    phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}'
    if re.search(phone_pattern, text):
        score += 15
    else:
        feedback.append("Phone number not found — add a contact number.")

    text_lower = text.lower()
    key_sections = ["experience", "education", "skills"]
    sections_found = sum(1 for section in key_sections if section in text_lower)
    section_score = (sections_found / len(key_sections)) * 30
    score += section_score
    if sections_found < len(key_sections):
        missing = [s for s in key_sections if s not in text_lower]
        feedback.append(f"Missing standard sections: {', '.join(missing)}")

    
    bullet_indicators = ['•', '- ', '* ']
    has_bullets = any(indicator in text for indicator in bullet_indicators)
    if has_bullets:
        score += 15
    else:
        feedback.append("No bullet points detected — use bullets for readability.")

    
    word_count = len(text.split())
    if 200 <= word_count <= 1000:
        score += 20
    elif word_count < 200:
        feedback.append("Resume seems too short — add more detail.")
        score += 5
    else:
        feedback.append("Resume seems too long — consider trimming it.")
        score += 10

    return {
        "ats_score": round(score, 2),
        "feedback": feedback
    }