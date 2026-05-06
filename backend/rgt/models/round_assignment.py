from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from rgt.extensions import RGTBase


class RoundAssignment(RGTBase):
    __tablename__ = "round_assignment"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("study_session.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    triad_id = Column(Integer, ForeignKey("triad.id"), nullable=False)
    status = Column(String(20), default="in_progress")
    skipped = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    session = relationship("StudySession", backref="rounds")
    triad = relationship("Triad")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "round_number": self.round_number,
            "triad_id": self.triad_id,
            "triad": self.triad.to_dict() if self.triad else None,
            "status": self.status,
            "skipped": self.skipped,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
