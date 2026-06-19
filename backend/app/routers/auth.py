from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, field_validator, EmailStr
from app.services.auth_service import signup_user, login_user, get_current_user, logout_user

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()


# ─── Request Schemas (defined here since they're auth-specific) ───────────────

class AuthRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def email_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Email cannot be empty.")
        return v

    @field_validator("password")
    @classmethod
    def password_must_be_strong_enough(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters.")
        return v


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(data: AuthRequest):
    """
    Register a new user.
    Supabase creates the user in auth.users and handles password hashing.
    Returns the new user's id and email.
    """
    try:
        user = signup_user(data.email, data.password)
        return {"message": "Account created successfully.", "user": user}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", status_code=status.HTTP_200_OK)
def login(data: AuthRequest):
    """
    Log in an existing user.
    Returns a JWT access token — the frontend must store this
    and send it as 'Authorization: Bearer <token>' on every request.
    """
    try:
        result = login_user(data.email, data.password)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.get("/me", status_code=status.HTTP_200_OK)
def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Protected route — returns the currently logged in user's info.
    Frontend sends: Authorization: Bearer <access_token>
    Used to verify the token is still valid (e.g. on page refresh).
    """
    try:
        user = get_current_user(credentials.credentials)
        return {"user": user}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Log out the user.
    Frontend sends: Authorization: Bearer <access_token>
    """
    try:
        logout_user(credentials.credentials)
        return {"message": "Logged out successfully."}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )