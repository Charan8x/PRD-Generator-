from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    project_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    created_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    document = relationship(
        "GeneratedDocument",
        back_populates="project",
        cascade="all, delete-orphan",
        uselist=False,  # one-to-one: one project has exactly one document row
        lazy="select",
    )

    def __repr__(self):
        return f"<Project id={self.id} name={self.project_name!r} user_id={self.user_id!r}>"


class GeneratedDocument(Base):
    __tablename__ = "generated_documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Each of the 7 sections gets its own column
    summary = Column(Text, nullable=False)
    features = Column(Text, nullable=False)
    user_stories = Column(Text, nullable=False)
    db_design = Column(Text, nullable=False)
    apis = Column(Text, nullable=False)
    test_cases = Column(Text, nullable=False)
    dev_plan = Column(Text, nullable=False)

    project = relationship("Project", back_populates="document")

    def __repr__(self):
        return f"<GeneratedDocument id={self.id} project_id={self.project_id}>"