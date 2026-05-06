from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship

from rgt.extensions import RGTBase


class ConstructRating(RGTBase):
    __tablename__ = "construct_rating"

    id = Column(Integer, primary_key=True)
    round_assignment_id = Column(Integer, ForeignKey("round_assignment.id"), nullable=False)
    video_id = Column(Integer, ForeignKey("video.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    round_assignment = relationship("RoundAssignment", backref="construct_ratings")
    video = relationship("Video")

    def to_dict(self):
        return {
            "id": self.id,
            "round_assignment_id": self.round_assignment_id,
            "video_id": self.video_id,
            "rating": self.rating,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
