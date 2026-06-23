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


def update_project(db: Session, project: Project, data: ProjectCreate) -> Project:
    """Update name and description of an existing project."""
    project.project_name = data.project_name.strip()
    project.description = data.description.strip()
    db.commit()
    db.refresh(project)
    return project


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


def edit_project_prd(
    db: Session,
    project: Project,
    new_project_name: str | None,
    edit_request: str | None,
    target_section: str | None,
) -> tuple[Project, dict[str, str]]:
    """
    Handles rename find-and-replace (Part A) and targeted AI edit (Part B),
    updating the Projects and GeneratedDocument tables, and appending logs to description.
    """
    from datetime import datetime, timezone
    from app.services import ai_service

    document = project.document
    if not document:
        raise ValueError("Cannot edit a project that has no generated PRD document.")

    sections = {
        "summary": document.summary,
        "features": document.features,
        "user_stories": document.user_stories,
        "techstack": document.techstack,
        "db_design": document.db_design,
        "apis": document.apis,
        "test_cases": document.test_cases,
        "dev_plan": document.dev_plan,
    }

    old_project_name = project.project_name
    section_keys = ["summary", "features", "user_stories", "techstack", "db_design", "apis", "test_cases", "dev_plan"]

    # Part A: Project Name Edit (Find-and-replace)
    if new_project_name and new_project_name.strip() != old_project_name:
        new_name_clean = new_project_name.strip()
        
        # Perform literal replacement in all sections
        for key in section_keys:
            if sections[key]:
                sections[key] = sections[key].replace(old_project_name, new_name_clean)

        # Update Project Name in DB
        project.project_name = new_name_clean
        
        # Save renamed sections to document
        document.summary = sections["summary"]
        document.features = sections["features"]
        document.user_stories = sections["user_stories"]
        document.techstack = sections["techstack"]
        document.db_design = sections["db_design"]
        document.apis = sections["apis"]
        document.test_cases = sections["test_cases"]
        document.dev_plan = sections["dev_plan"]

        # Append log entry to Projects.description
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        log_entry = (
            f"\n\n---EDIT [{timestamp}]---\n"
            f"Request: Renamed project from \"{old_project_name}\" to \"{new_name_clean}\"\n"
            f"Section(s) updated: all (name replacement)\n"
        )
        project.description += log_entry

    # Part B: Content Edit (Targeted Edit)
    if edit_request and edit_request.strip():
        # Call AI service for targeted edit using current (possibly renamed) sections
        mapped_target = target_section
        if target_section == "development_plan":
            mapped_target = "dev_plan"

        changed_sections = ai_service.generate_edit_prd(
            project_name=project.project_name,
            current_sections=sections,
            edit_request=edit_request.strip(),
            target_section=mapped_target,
        )

        # Update document only for changed columns
        for key, new_content in changed_sections.items():
            if key in sections:
                sections[key] = new_content
                setattr(document, key, new_content)

        # Append log entry to Projects.description
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        updated_keys = ", ".join(changed_sections.keys())
        log_entry = (
            f"\n\n---EDIT [{timestamp}]---\n"
            f"Request: {edit_request.strip()}\n"
            f"Section(s) updated: {updated_keys}\n"
        )
        project.description += log_entry

    db.commit()
    db.refresh(project)
    db.refresh(document)

    return project, sections
