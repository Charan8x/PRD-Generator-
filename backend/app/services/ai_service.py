from groq import Groq
from app.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

# The exact 7 section keys stored in the DB
SECTION_KEYS = [
    "summary",
    "features",
    "user_stories",
    "db_design",
    "apis",
    "test_cases",
    "dev_plan",
]

# Maps DB key -> label the AI will use in its response
SECTION_LABELS: dict[str, str] = {
    "summary":      "PROJECT SUMMARY",
    "features":     "FEATURES",
    "user_stories": "USER STORIES",
    "db_design":    "DATABASE DESIGN",
    "apis":         "API SUGGESTIONS",
    "test_cases":   "TEST CASES",
    "dev_plan":     "DEVELOPMENT PLAN",
}

# Reverse map: label -> DB key (used during parsing)
LABEL_TO_KEY: dict[str, str] = {v: k for k, v in SECTION_LABELS.items()}


def build_prompt(project_name: str, description: str) -> str:
    sections_instruction = "\n".join(
        f"{label}\n(Write the {key.replace('_', ' ')} here)"
        for key, label in SECTION_LABELS.items()
    )

    return f"""You are a Senior Product Manager. Generate a complete project planning document.

Project Name: {project_name}
Project Description: {description}

Return EXACTLY seven sections in this order. Each section header must be on its own line in UPPERCASE exactly as shown. Do not add any text before the first section header.

{sections_instruction}

Rules:
- Every section must have detailed, specific content.
- Do not skip any section.
- Do not add extra sections.
- Do not use markdown formatting like ** or ## inside sections.
"""


def parse_sections(raw_text: str) -> dict[str, str]:
    """
    Parse Groq's response into a dict of { db_key: content }.
    Iterates line by line; when a known section label is found,
    everything until the next label becomes that section's content.
    """
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

    # Save the last section
    if current_key is not None:
        sections[current_key] = "\n".join(current_lines).strip()

    return sections


def generate_prd(project_name: str, description: str) -> dict[str, str]:
    """
    Calls Groq API with llama-3.3-70b-versatile, parses response into 7 sections.
    Raises ValueError if any section is missing or empty.
    Raises Exception (propagated) for API failures.
    """
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

    # Validate all 7 sections are present and non-empty
    missing = [key for key in SECTION_KEYS if key not in sections or not sections[key].strip()]
    if missing:
        raise ValueError(f"AI response is missing sections: {missing}. Raw response: {raw_text[:500]}")

    return sections