from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Table
from sqlalchemy.orm import relationship

from rgt.extensions import RGTBase

triad_videos = Table(
    "triad_videos",
    RGTBase.metadata,
    Column("triad_id", Integer, ForeignKey("triad.id"), primary_key=True),
    Column("video_id", Integer, ForeignKey("video.id"), primary_key=True),
)


class Triad(RGTBase):
    __tablename__ = "triad"

    id = Column(Integer, primary_key=True)
    times_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    videos = relationship("Video", secondary=triad_videos, lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "videos": [v.to_dict() for v in self.videos],
            "times_used": self.times_used,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
