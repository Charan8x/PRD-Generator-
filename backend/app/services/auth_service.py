from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client using your project URL and anon key
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


def signup_user(email: str, password: str) -> dict:
    """
    Register a new user with Supabase Auth.
    Supabase stores the user in auth.users — we never touch passwords directly.
    Returns the user object on success.
    Raises an exception if the email is already registered.
    """
    try:
        response = supabase.auth.sign_up({
            "email": email,
            "password": password,
        })

        if response.user is None:
            raise ValueError("Signup failed. Please try again.")

        return {
            "id": response.user.id,
            "email": response.user.email,
        }

    except Exception as e:
        raise ValueError(str(e))


def login_user(email: str, password: str) -> dict:
    """
    Log in an existing user with Supabase Auth.
    Returns the access token and user info on success.
    The access token is a JWT — the frontend stores it and sends it
    with every subsequent request in the Authorization header.
    Raises an exception if credentials are wrong.
    """
    try:
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })

        if response.user is None or response.session is None:
            raise ValueError("Invalid email or password.")

        return {
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": response.user.id,
                "email": response.user.email,
            }
        }

    except Exception as e:
        raise ValueError(str(e))


def get_current_user(token: str) -> dict:
    """
    Verify a JWT token and return the user it belongs to.
    Called by protected routes to confirm the user is logged in.
    Raises an exception if the token is invalid or expired.
    """
    try:
        response = supabase.auth.get_user(token)

        if response.user is None:
            raise ValueError("Invalid or expired token.")

        return {
            "id": response.user.id,
            "email": response.user.email,
        }

    except Exception as e:
        raise ValueError(str(e))


def logout_user(token: str) -> None:
    """
    Log out the user by signing them out in Supabase.
    """
    try:
        supabase.auth.set_session(access_token=token, refresh_token="")
        supabase.auth.sign_out()
    except Exception as e:
        raise ValueError(str(e))