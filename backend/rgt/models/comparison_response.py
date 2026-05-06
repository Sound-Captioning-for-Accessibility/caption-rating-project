from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship

from rgt.extensions import RGTBase


class ComparisonResponse(RGTBase):
    __tablename__ = "comparison_response"

    id = Column(Integer, primary_key=True)
    round_assignment_id = Column(Integer, ForeignKey("round_assignment.id"), nullable=False)
    selected_video_one_id = Column(Integer, ForeignKey("video.id"), nullable=False)
    selected_video_two_id = Column(Integer, ForeignKey("video.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    round_assignment = relationship("RoundAssignment", backref="comparison_responses")
    selected_video_one = relationship("Video", foreign_keys=[selected_video_one_id])
    selected_video_two = relationship("Video", foreign_keys=[selected_video_two_id])

    def to_dict(self):
        return {
            "id": self.id,
            "round_assignment_id": self.round_assignment_id,
            "selected_video_one_id": self.selected_video_one_id,
            "selected_video_two_id": self.selected_video_two_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
