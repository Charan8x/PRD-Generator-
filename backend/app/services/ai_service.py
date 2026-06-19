from groq import Groq
from app.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

<<<<<<< HEAD
# Model: groq/compound instead of a plain chat model. Compound is Groq's
# agentic system — it can autonomously call a server-side web_search tool
# (powered by Tavily) before answering, with no extra API key or manual
# tool-calling loop needed on our side. This is what lets the AI actually
# verify "is there a free tier for X" instead of guessing. See:
# https://console.groq.com/docs/compound
MODEL = "groq/compound"

# The 8 section keys stored in the DB (7 original + "techstack", added per
# the `prd` skill's Technical Specifications requirement). NOTE: this is a
# DB schema change — the Generated Documents table needs a new `techstack`
# column, and schemas.py / project_service.py need to know about it too.
=======
>>>>>>> cfa0fc6cfec5beef8fa7247382f176130378de1f
SECTION_KEYS = [
    "summary",
    "techstack",
    "features",
    "user_stories",
    "db_design",
    "apis",
    "test_cases",
    "dev_plan",
]

SECTION_LABELS: dict[str, str] = {
    "summary":      "PROJECT SUMMARY",
    "techstack":    "TECH STACK",
    "features":     "FEATURES",
    "user_stories": "USER STORIES",
    "db_design":    "DATABASE DESIGN",
    "apis":         "API SUGGESTIONS",
    "test_cases":   "TEST CASES",
    "dev_plan":     "DEVELOPMENT PLAN",
}

LABEL_TO_KEY: dict[str, str] = {v: k for k, v in SECTION_LABELS.items()}

# Per-section guidance derived from the `prd` skill's quality standards and
# Strict PRD Schema, adapted to our fixed 8-section format. Each entry tells
# the model exactly what skill-quality content belongs in that section.
SECTION_GUIDANCE: dict[str, str] = {
    "summary": (
        "State the Problem Statement (1-2 sentences), the Proposed Solution "
        "(1-2 sentences), and 3-5 measurable Success Criteria."
    ),
    "techstack": (
        "Write one short paragraph per layer, each starting with a label on "
        "its own line exactly like 'Frontend:', 'Backend:', 'Database:' "
        "(use 'Database and Auth:' if the database service also handles "
        "auth; omit this layer only if the database is fully embedded in "
        "the backend framework), and 'Other Tools:' if relevant. Each "
        "paragraph is 2-4 full sentences of prose — NOT a bullet list — "
        "naming concrete technologies and briefly explaining what that "
        "layer is responsible for in this project. Apply the free-tool "
        "rule: search before naming a paid-sounding service. Match this "
        "style exactly (write your own content for the real project, this "
        "is only showing the format):\n"
        "Frontend: HTML, CSS, and JavaScript. React may be used for a more "
        "dynamic single-page experience. The frontend handles the login "
        "page, the main layout with sidebar, form interactions, API calls "
        "to the backend, and rendering the generated output."
    ),
    "features": (
        "Brainstorm broadly and concretely: list core features, then "
        "nice-to-have features, then at least one creative feature idea "
        "that differentiates this project beyond the obvious. Every "
        "feature must be specific enough that a developer could start "
        "building it without asking a follow-up question. After the "
        "feature list, add a short 'Non-Goals:' list of what this project "
        "will explicitly NOT build."
    ),
    "user_stories": (
        "Write each story as: As a [user], I want to [action], so that "
        "[benefit]. Follow every story with 2-4 bullet Acceptance Criteria "
        "describing what 'done' looks like."
    ),
    "db_design": (
        "For EVERY table, write a sub-heading on its own line with just "
        "the table name and nothing else on that line, then 1-2 sentences "
        "of prose describing what it stores and why it exists, then one "
        "sentence starting with 'Key fields are:' followed by a "
        "comma-separated list written as 'name (type, constraint/notes)'. "
        "Add one more sentence only if there's an important implementation "
        "note (e.g. how auth/passwords are handled). Match this style "
        "exactly (write your own tables for the real project, this is "
        "only showing the format):\n"
        "Users Table\n"
        "This table stores one record per registered user account. Key "
        "fields are: id (UUID, primary key, auto-generated), email (text, "
        "unique, required), created_at (timestamp, set automatically on "
        "registration). Passwords are never stored in plain text.\n"
        "After all tables, add a 'Relationships:' paragraph in prose "
        "stating every foreign key and what kind of relationship it "
        "represents (one-to-many, many-to-many, etc.) — never leave a "
        "relationship implied."
    ),
    "apis": (
        "For EVERY endpoint, write a sub-heading on its own line formatted "
        "exactly as 'METHOD /path' (e.g. 'POST /auth/logout') with nothing "
        "else on that line, followed by 1-3 sentences of prose describing "
        "what it does, what it requires (e.g. authentication, request "
        "body), and what it returns — NOT a single-line description. Match "
        "this style exactly (write your own endpoints for the real "
        "project, this is only showing the format):\n"
        "POST /auth/signup\n"
        "Registers a new user. Accepts email and password. Delegates to "
        "the auth provider and returns a session token on success. This "
        "endpoint is unauthenticated.\n"
        "POST /auth/login\n"
        "Logs in an existing user. Accepts email and password. Delegates "
        "to the auth provider and returns a session token on success. "
        "This endpoint is unauthenticated.\n"
        "POST /auth/logout\n"
        "Logs out the current user by invalidating the session token. "
        "Requires a valid session token in the request header.\n"
        "POST /projects\n"
        "Creates a new project record linked to the authenticated user. "
        "Accepts project_name and description in the request body. "
        "Requires a valid session token. Returns the newly created project "
        "including its id and created_date.\n"
        "GET /projects\n"
        "Returns a list of all projects belonging to the authenticated "
        "user, ordered by created_date descending. Used to populate the "
        "sidebar. Each item includes the project id, name, and created "
        "date.\n"
        "GET /projects/{id}\n"
        "Fetches a single project and its associated generated document. "
        "Verifies that the project belongs to the authenticated user. "
        "Returns all section columns.\n"
        "List every endpoint this specific project actually needs — this "
        "is a representative set, not a fixed list to copy."
    ),
    "test_cases": (
        "Number each test case sequentially as 'TC-01:', 'TC-02:', etc., "
        "each followed by 1-2 sentences of prose describing the scenario "
        "and the concrete, verifiable expected outcome — written as "
        "continuous prose, not split into separate bullets. Match this "
        "style exactly (write your own test cases for the real project, "
        "this is only showing the format):\n"
        "TC-01: A new user must be able to register with a valid email and "
        "password. After registration the user must be redirected to the "
        "main application page and their session must be active.\n"
        "TC-02: Attempting to register with an email that already exists "
        "must show an appropriate error message and must not create a "
        "duplicate account.\n"
        "Write at least 8 test cases covering the core flows of this "
        "specific project."
    ),
    "dev_plan": (
        "Write each phase as a heading on its own line formatted exactly "
        "as 'Phase N — Title' with nothing else on that line, followed by "
        "a short paragraph of plain prose sentences describing what gets "
        "built in that phase — NOT a bullet list. Match this style exactly "
        "(write your own phases for the real project, this is only "
        "showing the format):\n"
        "Phase 4 — Testing and Polish\n"
        "Write and run all test cases defined in the Test Cases section. "
        "Fix any bugs found during testing. Ensure that one user cannot "
        "access another user's data. Add loading and error states to all "
        "interactive elements. Prepare the application for a demo.\n"
        "After all phases, add a short 'Technical Risks:' paragraph in "
        "prose listing 2-4 risks (e.g. latency, cost, dependency failures)."
    ),
}

# ---------------------------------------------------------------------------
# System prompt: persona + quality bar, adapted from the `prd` skill
# (SKILL_prd.md). The skill's "Strict PRD Schema" and "Discovery Phase" don't
# apply directly here — this app has a fixed 8-column schema and a one-shot
# (non-interactive) generation flow — but its writing standards translate
# directly to each of the 8 sections below.
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are a Senior Product Manager writing a project planning document.
Think through the project's realistic context before writing each section —
favor accurate, specific content over generic filler, and use your web
search tool whenever it would make a section more accurate.

Follow these writing standards for every section:

- Be concrete and measurable. Never use unqualified vague words like "fast",
  "easy", "intuitive", "modern", or "robust" — if you use a term like that,
  attach a measurable definition (e.g. "loads in under 2 seconds" instead of
  "loads fast").
- Whenever you name a specific platform, service, or tool anywhere in the
  document (not just Tech Stack), search the web first to check whether it
  currently has a usable free tier or there's a free/open-source
  alternative for this exact use case. Recommend the free option and name
  it explicitly if one exists. If nothing free genuinely fits, a paid
  option is fine — just say so plainly instead of implying it's free.
- Brainstorm features broadly and creatively: core features, nice-to-have
  features, and at least one differentiating idea that goes beyond the
  obvious — but every feature must still be specific enough that a
  developer could start building it without asking a follow-up question.
- Each user story must follow the exact form: "As a [user], I want to
  [action], so that [benefit]." Immediately follow each story with 2-4
  bullet "Acceptance Criteria" describing what "done" looks like.
- Always include a short "Non-Goals" list of what the project will
  explicitly NOT build.
- Test cases must be numbered "TC-01:", "TC-02:", etc., each a short prose
  description of a concrete scenario and a concrete, verifiable expected
  outcome — never a generic instruction like "test the login".
- API suggestions: a "METHOD /path" heading per endpoint, followed by 1-3
  prose sentences covering what it does, what it requires, and what it
  returns — not a single-line description.
- Database design: a heading per table, then 1-2 prose sentences on what it
  stores and why, then one sentence starting with "Key fields are:"
  listing fields as "name (type, constraint/notes)". Then a "Relationships:"
  paragraph stating every relationship between tables explicitly, never
  implied.
- Tech stack: one prose paragraph per layer (Frontend:, Backend:,
  Database: — only if it's a separate service from the backend — and
  Other Tools:), 2-4 sentences each, applying the free-tool-check rule
  above. No bullet points in this section.
- The development plan is a heading per phase ("Phase N — Title") followed
  by a short prose paragraph of what gets built in that phase, then a
  "Technical Risks:" paragraph with 2-4 risks.
- Do not invent constraints the user didn't give you (budget, deadline,
  team size, specific tech choices beyond what's implied). If something
  relevant is unspecified, write "TBD" rather than making it up.
"""


def build_prompt(project_name: str, description: str) -> str:
<<<<<<< HEAD
    sections_instruction = "\n\n".join(
        f"{label}\n{SECTION_GUIDANCE[key]}"
        for key, label in SECTION_LABELS.items()
    )

    return f"""Generate a complete project planning document for the following project.
=======
    return f"""You are a Senior Product Manager writing a formal Product Requirements Document (PRD).
>>>>>>> cfa0fc6cfec5beef8fa7247382f176130378de1f

Project Name: {project_name}
Project Description: {description}

<<<<<<< HEAD
Return EXACTLY eight sections in this order. Each section header must be on its own line in UPPERCASE exactly as shown. Do not add any text before the first section header.
=======
Generate a complete, production-grade PRD strictly following this schema for ALL seven sections.
>>>>>>> cfa0fc6cfec5beef8fa7247382f176130378de1f

---

<<<<<<< HEAD
Rules:
- Every section must have detailed, specific content that follows the writing standards you were given.
=======
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
>>>>>>> cfa0fc6cfec5beef8fa7247382f176130378de1f
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
<<<<<<< HEAD
    """
    Calls Groq's compound system (web search enabled) and parses the
    response into 8 sections.
    Raises ValueError if any section is missing or empty.
    Raises Exception (propagated) for API failures.
    """
=======
>>>>>>> cfa0fc6cfec5beef8fa7247382f176130378de1f
    prompt = build_prompt(project_name, description)

    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=8192,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        # Restrict the compound system to just search-related tools — we
        # don't need code execution for a planning document, and limiting
        # the tool set keeps latency/cost down.
        compound_custom={"tools": {"enabled_tools": ["web_search", "visit_website"]}},
    )

    raw_text: str = response.choices[0].message.content
    sections = parse_sections(raw_text)

<<<<<<< HEAD
    # Validate all 8 sections are present and non-empty
=======
>>>>>>> cfa0fc6cfec5beef8fa7247382f176130378de1f
    missing = [key for key in SECTION_KEYS if key not in sections or not sections[key].strip()]
    if missing:
        raise ValueError(f"AI response is missing sections: {missing}. Raw response: {raw_text[:500]}")

    return sections