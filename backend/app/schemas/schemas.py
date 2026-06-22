from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import List, Optional


# ─── Request Schemas ──────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    project_name: str
    description: str

    @field_validator("project_name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("project_name cannot be empty")
        return v

    @field_validator("description")
    @classmethod
    def description_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("description cannot be empty")
        return v


# ─── Response Schemas ─────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: int
    project_id: int
    summary: str
    features: str
    user_stories: str
    techstack: str
    db_design: str
    apis: str
    test_cases: str
    dev_plan: str

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    id: int
    user_id: str
    project_name: str
    description: str
    created_date: datetime

    model_config = {"from_attributes": True}


class ProjectWithDocuments(BaseModel):
    id: int
    user_id: str
    project_name: str
    description: str
    created_date: datetime
    document: Optional[DocumentOut] = None

    model_config = {"from_attributes": True}


class GenerateResponse(BaseModel):
    project_id: int
    sections: dict[str, str]