from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import projects, auth
from app.db.init_db import init_db

app = FastAPI(
    title="AI PRD Generator",
    description="Generate full product planning documents using AI.",
    version="1.0.0",
)

# Allow requests from the React frontend running on Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB tables on startup if they don't exist
init_db()

# Register routers
app.include_router(auth.router)
app.include_router(projects.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "AI PRD Generator API is running"}