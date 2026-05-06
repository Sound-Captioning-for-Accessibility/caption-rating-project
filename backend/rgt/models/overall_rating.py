from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship

from rgt.extensions import RGTBase


class OverallRating(RGTBase):
    __tablename__ = "overall_rating"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("study_session.id"), nullable=False)
    video_id = Column(Integer, ForeignKey("video.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    revised_rating = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    session = relationship("StudySession", backref="overall_ratings")
    video = relationship("Video")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "video_id": self.video_id,
            "rating": self.rating,
            "revised_rating": self.revised_rating,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
