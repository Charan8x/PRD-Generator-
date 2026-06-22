from groq import Groq
from app.config import settings
import traceback

client = Groq(api_key=settings.GROQ_API_KEY)

# 8 section keys — order matters for the DOCX output
SECTION_KEYS = [
    "summary",
    "features",
    "user_stories",
    "techstack",
    "db_design",
    "apis",
    "test_cases",
    "dev_plan",
]

SECTION_LABELS: dict[str, str] = {
    "summary":      "PROJECT SUMMARY",
    "features":     "FEATURES",
    "user_stories": "USER STORIES",
    "techstack":    "TECH STACK",
    "db_design":    "DATABASE DESIGN",
    "apis":         "API SUGGESTIONS",
    "test_cases":   "TEST CASES",
    "dev_plan":     "DEVELOPMENT PLAN",
}

LABEL_TO_KEY: dict[str, str] = {v: k for k, v in SECTION_LABELS.items()}


def build_prompt(project_name: str, description: str) -> str:
    return f"""You are a Senior Product Manager. Generate a complete Product Requirements Document (PRD) for the project below.

Project Name: {project_name}
Project Description: {description}

Output EXACTLY eight sections in this order. Each section header must be on its own line in UPPERCASE exactly as shown. Do not repeat or echo these instructions in your output. Write the actual content directly.

PROJECT SUMMARY
Problem Statement: [State the core problem this project solves in 1-2 sentences.]
Proposed Solution: [Describe what is being built and how it solves the problem in 1-2 sentences.]
Success Criteria:
- [Measurable KPI with a number or percentage]
- [Measurable KPI with a number or percentage]
- [Measurable KPI with a number or percentage]
Target Users: [Describe the primary and secondary users.]
Scope: In scope: [list what is included]. Out of scope: [list what is excluded].

FEATURES
[Feature Name]: [What it does and why it matters. Priority: High/Medium/Low.]
[Feature Name]: [What it does and why it matters. Priority: High/Medium/Low.]
[Repeat for at least 6 features.]

USER STORIES
As a [user], I want to [action] so that [benefit].
- [Acceptance criterion 1]
- [Acceptance criterion 2]
[Repeat for at least 6 user stories.]

TECH STACK
Frontend: [Technology] - [Why it fits this project]
Backend: [Technology] - [Why it fits this project]
Database: [Technology] - [Why it fits this project]
Authentication: [Technology] - [Why it fits this project]
File Storage: [Technology] - [Why it fits this project]
Hosting: [Technology] - [Why it fits this project]
[Add any other relevant layers]

DATABASE DESIGN
[Table Name]: [column name (type, constraints), ...] - [Purpose of this table]
[Relationships: describe how tables relate]
[Indexes: list any performance indexes]

API SUGGESTIONS
[METHOD] [/route] - [Purpose] - Auth: [Yes/No]
Request: [key fields]
Response: [key fields]
[Repeat for all major endpoints]

TEST CASES
TC-01: [What is being tested]
Steps: [numbered steps]
Expected: [expected result]
[Repeat for at least 6 test cases covering happy path, validation, auth, edge cases]

DEVELOPMENT PLAN
Phase 1 - [Name]: [Goal]. Tasks: [list tasks]. Effort: [estimate]. Deliverable: [output].
Phase 2 - [Name]: [Goal]. Tasks: [list tasks]. Effort: [estimate]. Deliverable: [output].
Phase 3 - [Name]: [Goal]. Tasks: [list tasks]. Effort: [estimate]. Deliverable: [output].
Phase 4 - [Name]: [Goal]. Tasks: [list tasks]. Effort: [estimate]. Deliverable: [output].

RULES:
- Output section headers EXACTLY as shown in UPPERCASE on their own line.
- Do NOT include these instructions or template placeholders in your output.
- Do NOT use markdown formatting like ** or ##.
- Write real, specific content for this exact project. No generic filler.
- Do not add any text before PROJECT SUMMARY.
"""


def parse_sections(raw_text: str) -> dict[str, str]:
    sections: dict[str, str] = {}
    current_key: str | None = None
    current_lines: list[str] = []

    for line in raw_text.splitlines():
        stripped = line.strip()
        if stripped in LABEL_TO_KEY:
            if current_key is not None:
                sections[current_key] = "\n".join(current_lines).strip()
            current_key = LABEL_TO_KEY[stripped]
            current_lines = []
        else:
            if current_key is not None:
                current_lines.append(line)

    if current_key is not None:
        sections[current_key] = "\n".join(current_lines).strip()

    return sections


def generate_prd(project_name: str, description: str) -> dict[str, str]:
    prompt = build_prompt(project_name, description)

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            max_tokens=4096,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )
    except Exception as e:
        print(f"\n[AI SERVICE ERROR] Groq API call failed:")
        print(traceback.format_exc())
        raise Exception(f"Groq API error: {str(e)}")

    raw_text: str = response.choices[0].message.content
    print(f"\n[AI SERVICE] Raw response preview:\n{raw_text[:300]}\n")

    sections = parse_sections(raw_text)

    missing = [key for key in SECTION_KEYS if key not in sections or not sections[key].strip()]
    if missing:
        raise ValueError(f"AI response is missing sections: {missing}. Raw response: {raw_text[:500]}")

    return sections