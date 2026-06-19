from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.schemas import (
    ProjectCreate,
    ProjectOut,
    ProjectWithDocuments,
    GenerateResponse,
)
from app.services import project_service, ai_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])
security = HTTPBearer()


def get_user_from_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dependency used by all project routes.
    Verifies the JWT token and returns the current user.
    If the token is missing or invalid, returns 401.
    """
    try:
        return get_current_user(credentials.credentials)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_user_from_token),
):
    """
    Create a new project linked to the logged in user.
    user_id comes from the verified JWT token — not from the request body.
    """
    project = project_service.create_project(db, data, user_id=current_user["id"])
    return project


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_user_from_token),
):
    """
    Update an existing project linked to the logged in user.
    """
    project = project_service.get_project(db, project_id, user_id=current_user["id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found.",
        )
    return project_service.update_project(db, project, data)


@router.post("/{project_id}/generate", response_model=GenerateResponse, status_code=status.HTTP_200_OK)
def generate_prd(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_user_from_token),
):
    """
    Trigger AI generation for an existing project.
    Only the owner of the project can trigger generation.
    """
    project = project_service.get_project(db, project_id, user_id=current_user["id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found.",
        )

    try:
        sections = ai_service.generate_prd(project.project_name, project.description)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service failed. Please try again later.",
        )

    project_service.save_documents(db, project_id, sections)

    return GenerateResponse(project_id=project_id, sections=sections)


@router.get("/{project_id}", response_model=ProjectWithDocuments)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_user_from_token),
):
    """
    Fetch a single project and all its sections.
    Only returns the project if it belongs to the logged in user.
    """
    project = project_service.get_project(db, project_id, user_id=current_user["id"])
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {project_id} not found.",
        )
    return project


@router.get("", response_model=list[ProjectOut])
def get_all_projects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_user_from_token),
):
    """
    Fetch all projects for the logged in user.
    Used to populate the sidebar history panel.
    """
    return project_service.get_all_projects(db, user_id=current_user["id"])