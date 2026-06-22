from sqlalchemy.orm import Session
from app.models.models import Project, GeneratedDocument
from app.schemas.schemas import ProjectCreate


def create_project(db: Session, data: ProjectCreate, user_id: str) -> Project:
    """Create a new project record linked to the logged in user."""
    project = Project(
        user_id=user_id,
        project_name=data.project_name.strip(),
        description=data.description.strip(),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def get_project(db: Session, project_id: int, user_id: str) -> Project | None:
    """Fetch a single project by ID, filtered by user_id."""
    return (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == user_id)
        .first()
    )


def get_all_projects(db: Session, user_id: str) -> list[Project]:
    """Fetch all projects for a specific user, most recent first."""
    return (
        db.query(Project)
        .filter(Project.user_id == user_id)
        .order_by(Project.created_date.desc())
        .all()
    )


def save_documents(db: Session, project_id: int, sections: dict[str, str]) -> None:
    """
    Save all 8 sections as a single GeneratedDocument row.
    Each section stored in its own column. Overwrites if it exists.
    """
    document = db.query(GeneratedDocument).filter(GeneratedDocument.project_id == project_id).first()
    if document:
        document.summary = sections["summary"]
        document.features = sections["features"]
        document.user_stories = sections["user_stories"]
        document.techstack = sections["techstack"]
        document.db_design = sections["db_design"]
        document.apis = sections["apis"]
        document.test_cases = sections["test_cases"]
        document.dev_plan = sections["dev_plan"]
    else:
        document = GeneratedDocument(
            project_id=project_id,
            summary=sections["summary"],
            features=sections["features"],
            user_stories=sections["user_stories"],
            techstack=sections["techstack"],
            db_design=sections["db_design"],
            apis=sections["apis"],
            test_cases=sections["test_cases"],
            dev_plan=sections["dev_plan"],
        )
        db.add(document)
    db.commit()


def rename_project(db: Session, project: Project, project_name: str) -> Project:
    """Rename an existing project."""
    project.project_name = project_name.strip()
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project) -> None:
    """Delete a project and its cascade relations."""
    db.delete(project)
    db.commit()