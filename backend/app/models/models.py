from sqlalchemy import String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.db.database import Base
from datetime import datetime


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    document: Mapped["GeneratedDocument | None"] = relationship(
        "GeneratedDocument",
        back_populates="project",
        cascade="all, delete-orphan",
        uselist=False,
        lazy="select",
    )

    def __repr__(self):
        return f"<Project id={self.id} name={self.project_name!r} user_id={self.user_id!r}>"


class GeneratedDocument(Base):
    __tablename__ = "generated_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)

    summary: Mapped[str]      = mapped_column(Text, nullable=False)
    features: Mapped[str]     = mapped_column(Text, nullable=False)
    user_stories: Mapped[str] = mapped_column(Text, nullable=False)
    techstack: Mapped[str]    = mapped_column(Text, nullable=False)
    db_design: Mapped[str]    = mapped_column(Text, nullable=False)
    apis: Mapped[str]         = mapped_column(Text, nullable=False)
    test_cases: Mapped[str]   = mapped_column(Text, nullable=False)
    dev_plan: Mapped[str]     = mapped_column(Text, nullable=False)

    project: Mapped["Project"] = relationship("Project", back_populates="document")

    def __repr__(self):
        return f"<GeneratedDocument id={self.id} project_id={self.project_id}>"