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
    return f"""You are a Senior Product Manager writing a formal Product Requirements Document (PRD).

Project Name: {project_name}
Project Description: {description}

Generate a complete, production-grade PRD strictly following this schema for ALL eight sections.

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

TECH STACK
List all the key technologies, libraries, and frameworks that will be used for this project.
Be specific. E.g., Frontend (React, Vite, CSS variables), Backend (FastAPI, SQLAlchemy, Uvicorn, PostgreSQL), and details about hosting, version control, etc.

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
- Do not add extra sections beyond the eight listed.
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
        import sys
        print(f"Primary model openai/gpt-oss-120b failed: {e}. Trying fallback model qwen/qwen3.6-27b...", file=sys.stderr)
        try:
            response = client.chat.completions.create(
                model="qwen/qwen3.6-27b",
                max_tokens=4096,
                messages=[
                    {"role": "user", "content": prompt}
                ],
            )
        except Exception:
            print(f"\n[AI SERVICE ERROR] Groq API call failed:")
            print(traceback.format_exc())
            raise Exception(f"Groq API error: {str(e)}")

    raw_text: str = response.choices[0].message.content or ""
    print(f"\n[AI SERVICE] Raw response preview:\n{raw_text[:300]}\n")
    sections = parse_sections(raw_text)

    missing = [key for key in SECTION_KEYS if key not in sections or not sections[key].strip()]
    if missing:
        raise ValueError(f"AI response is missing sections: {missing}. Raw response: {raw_text[:500]}")

    return sections


EDIT_LABEL_TO_KEY = {
    "SUMMARY:": "summary",
    "FEATURES:": "features",
    "USER_STORIES:": "user_stories",
    "TECH_STACK:": "techstack",
    "TECHSTACK:": "techstack",
    "DB_DESIGN:": "db_design",
    "APIS:": "apis",
    "TEST_CASES:": "test_cases",
    "DEVELOPMENT_PLAN:": "dev_plan"
}


def parse_edit_response(raw_text: str) -> dict[str, str]:
    sections: dict[str, str] = {}
    current_key: str | None = None
    current_lines: list[str] = []

    for line in raw_text.splitlines():
        stripped = line.strip()
        upper_stripped = stripped.upper()
        if upper_stripped in EDIT_LABEL_TO_KEY:
            if current_key is not None:
                sections[current_key] = "\n".join(current_lines).strip()
            current_key = EDIT_LABEL_TO_KEY[upper_stripped]
            current_lines = []
        else:
            if current_key is not None:
                current_lines.append(line)

    if current_key is not None:
        sections[current_key] = "\n".join(current_lines).strip()

    return sections


def generate_edit_prd(
    project_name: str,
    current_sections: dict[str, str],
    edit_request: str,
    target_section: str | None
) -> dict[str, str]:
    context_lines = []
    labels_display = {
        "summary": "Current Project Summary",
        "features": "Current Features",
        "user_stories": "Current User Stories",
        "techstack": "Current Tech Stack",
        "db_design": "Current Database Design",
        "apis": "Current API Suggestions",
        "test_cases": "Current Test Cases",
        "dev_plan": "Current Development Plan"
    }
    
    for key in SECTION_KEYS:
        context_lines.append(f"{labels_display[key]}:\n{current_sections.get(key, '')}\n")
    
    context_str = "\n".join(context_lines)
    target_str = target_section if target_section else "Auto-detect"
    
    user_prompt = f"""Current Project Name: {project_name}

{context_str}
Target Section: {target_str}
User's Edit Request: {edit_request}
"""

    system_message = (
        "You are a Senior Product Manager revising an existing project plan. You will "
        "be given the full current PRD content and a specific change request. Your job "
        "is to update ONLY the section(s) that the change request actually affects. Do "
        "not regenerate sections that are not impacted. Do not repeat unchanged "
        "sections in your response. Default to changing exactly one section unless the "
        "request clearly requires changes across multiple sections (for example, a new "
        "feature that needs a corresponding user story and API entry). Return only the "
        "changed section(s), each labeled exactly as: SUMMARY:, FEATURES:, "
        "USER_STORIES:, TECH_STACK:, DB_DESIGN:, APIS:, TEST_CASES:, DEVELOPMENT_PLAN:. "
        "Do not add commentary outside these labels."
    )

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            max_tokens=4096,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt}
            ],
        )
    except Exception as e:
        import sys
        print(f"Primary model openai/gpt-oss-120b failed: {e}. Trying fallback model qwen/qwen3.6-27b...", file=sys.stderr)
        try:
            response = client.chat.completions.create(
                model="qwen/qwen3.6-27b",
                max_tokens=4096,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_prompt}
                ],
            )
        except Exception:
            print(f"\n[AI SERVICE ERROR] Groq API call failed:")
            print(traceback.format_exc())
            raise Exception(f"Groq API error: {str(e)}")

    raw_text: str = response.choices[0].message.content or ""
    return parse_edit_response(raw_text)
