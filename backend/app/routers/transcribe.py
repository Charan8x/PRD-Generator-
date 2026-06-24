from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from app.services.auth_service import get_current_user as auth_get_current_user
from app.config import settings
from groq import Groq

router = APIRouter(prefix="/transcribe", tags=["Transcribe"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        return auth_get_current_user(credentials.credentials)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

# Initialize Groq client
client = Groq(api_key=settings.GROQ_API_KEY)

@router.post("")
@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...), user=Depends(get_current_user)):
    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            return {"text": ""}
        
        # Set filename and content_type defaults if not provided
        filename = file.filename or "audio.webm"
        content_type = file.content_type or "audio/webm"
        
        transcription = client.audio.transcriptions.create(
            model="whisper-large-v3-turbo",
            file=(filename, audio_bytes, content_type),
            response_format="text",
            language="en"
        )
        
        # Safely handle both runtime string output and type checker expectations
        if isinstance(transcription, str):
            text = transcription.strip()
        else:
            text = getattr(transcription, "text", str(transcription)).strip()
        return {"text": text}
    except Exception as e:
        import traceback
        import sys
        print(f"[TRANSCRIBE ERROR] Transcription failed: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        # On Groq error -> HTTP 500: { "error": "Transcription failed." }
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Transcription failed."}
        )
