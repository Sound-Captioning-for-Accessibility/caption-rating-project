from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from rgt.extensions import RGTBase


class StudySession(RGTBase):
    __tablename__ = "study_session"

    id = Column(Integer, primary_key=True)
    participant_id = Column(Integer, ForeignKey("participant.id"), nullable=False)
    current_round = Column(Integer, default=1)
    total_rounds = Column(Integer, default=7)
    current_phase = Column(String(50), default="overall_ratings")
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    participant = relationship("Participant", backref="sessions")

    def to_dict(self):
        return {
            "id": self.id,
            "participant_id": self.participant_id,
            "current_round": self.current_round,
            "total_rounds": self.total_rounds,
            "current_phase": self.current_phase,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
