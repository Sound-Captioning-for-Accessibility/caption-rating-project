from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from rgt.extensions import RGTBase


class AdditionalConstruct(RGTBase):
    __tablename__ = "additional_construct"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("study_session.id"), nullable=False)
    pole_one = Column(String(255), nullable=False)
    pole_two = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("StudySession", backref="additional_constructs")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "pole_one": self.pole_one,
            "pole_two": self.pole_two,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
