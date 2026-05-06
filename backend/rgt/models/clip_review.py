from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship

from rgt.extensions import RGTBase


class ClipReview(RGTBase):
    __tablename__ = "clip_review"

    id = Column(Integer, primary_key=True)
    round_assignment_id = Column(Integer, ForeignKey("round_assignment.id"), nullable=False)
    video_id = Column(Integer, ForeignKey("video.id"), nullable=False)
    reviewed = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    round_assignment = relationship("RoundAssignment", backref="clip_reviews")
    video = relationship("Video")

    def to_dict(self):
        return {
            "id": self.id,
            "round_assignment_id": self.round_assignment_id,
            "video_id": self.video_id,
            "reviewed": self.reviewed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
