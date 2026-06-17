from app.db.database import engine, Base

# Import models so Base knows about them before create_all
from app.models.models import Project, GeneratedDocument  # noqa: F401


def init_db():
    Base.metadata.create_all(bind=engine)