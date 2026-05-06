from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from rgt.extensions import RGTBase


class ClipNote(RGTBase):
    __tablename__ = "clip_note"

    id = Column(Integer, primary_key=True)
    round_assignment_id = Column(Integer, ForeignKey("round_assignment.id"), nullable=False)
    video_id = Column(Integer, ForeignKey("video.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    round_assignment = relationship("RoundAssignment", backref="clip_notes")
    video = relationship("Video")

    def to_dict(self):
        return {
            "id": self.id,
            "round_assignment_id": self.round_assignment_id,
            "video_id": self.video_id,
            "note_text": self.note_text,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
