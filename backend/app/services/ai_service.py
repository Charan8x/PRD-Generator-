from groq import Groq
from app.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

SECTION_KEYS = [
    "summary",
    "features",
    "user_stories",
    "db_design",
    "apis",
    "test_cases",
    "dev_plan",
]

SECTION_LABELS: dict[str, str] = {
    "summary":      "PROJECT SUMMARY",
    "features":     "FEATURES",
    "user_stories": "USER STORIES",
    "db_design":    "DATABASE DESIGN",
    "apis":         "API SUGGESTIONS",
    "test_cases":   "TEST CASES",
    "dev_plan":     "DEVELOPMENT PLAN",
}

LABEL_TO_KEY: dict[str, str] = {v: k for k, v in SECTION_LABELS.items()}


def build_prompt(project_name: str, description: str) -> str:
    return f"""You are a Senior Product Manager writing a formal Product Requirements Document (PRD).

Project Name: {project_name}
Project Description: {description}

Generate a complete, production-grade PRD strictly following this schema for ALL seven sections.

---

PROJECT SUMMARY
Write an Executive Summary with:
- Problem Statement: 1-2 sentences on the core pain point this project solves.
- Proposed Solution: 1-2 sentences on what is being built and how it solves the problem.
- Success Criteria: 3-5 measurable KPIs (use numbers, percentages, or time-based targets).
- Target Users: Who are the primary and secondary users of this product.
- Scope: What is IN scope and what is explicitly OUT of scope.

---

FEATURES
List all key features of the product. For each feature:
- Feature Name: Short name.
- Description: What it does and why it matters.
- Priority: High / Medium / Low.
Be specific. Avoid vague descriptions like "user-friendly interface". Aim for at least 6-8 features.

---

USER STORIES
Write user stories in this exact format:
As a [user type], I want to [action] so that [benefit].
Acceptance Criteria:
  - [specific testable condition 1]
  - [specific testable condition 2]
Write at least 6 user stories covering the core flows of the product.

---

DATABASE DESIGN
Provide a complete database schema:
- List every table needed.
- For each table list: column name, data type, constraints (PK, FK, NOT NULL, UNIQUE).
- Explain the relationships between tables (one-to-one, one-to-many, many-to-many).
- Include any indexes that should be created for performance.

---

API SUGGESTIONS
List all API endpoints needed. For each endpoint provide:
- HTTP Method and Route (e.g. POST /users/register)
- Purpose: What it does.
- Request Body: Key fields expected.
- Response: Key fields returned.
- Auth Required: Yes / No.

---

TEST CASES
List important test cases. For each test case provide:
- Test ID (e.g. TC-01)
- Description: What is being tested.
- Preconditions: What must be true before the test.
- Steps: Numbered steps to execute.
- Expected Result: What should happen.
Cover: happy paths, validation errors, auth failures, and edge cases.

---

DEVELOPMENT PLAN
Break development into phases:
- Phase name and goal.
- Tasks: specific implementation tasks.
- Files or components involved.
- Estimated effort (days or weeks).
- Expected output or deliverable at the end of the phase.
Include at least 4 phases: Foundation, Core Features, Testing and Polish, Deployment.

---

STRICT RULES:
- Every section header must appear EXACTLY as shown above in UPPERCASE on its own line.
- Do not add any text before the first section header.
- Every section must have detailed, specific, measurable content.
- Do not use markdown symbols like **, ##, or *. Use plain text only.
- Do not skip any section.
- Do not add extra sections beyond the seven listed.
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

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=4096,
        messages=[
            {"role": "user", "content": prompt}
        ],
    )

    raw_text: str = response.choices[0].message.content
    sections = parse_sections(raw_text)

    missing = [key for key in SECTION_KEYS if key not in sections or not sections[key].strip()]
    if missing:
        raise ValueError(f"AI response is missing sections: {missing}. Raw response: {raw_text[:500]}")

    return sections