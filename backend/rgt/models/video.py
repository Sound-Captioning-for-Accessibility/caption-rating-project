from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from rgt.extensions import RGTBase


class Video(RGTBase):
    __tablename__ = "video"

    id = Column(Integer, primary_key=True)
    title = Column(String(300), nullable=False)
    youtube_id = Column(String(100), nullable=True)
    filename = Column(String(500), nullable=True)
    caption_type = Column(String(100), nullable=True)
    metadata_json = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "youtube_id": self.youtube_id,
            "filename": self.filename,
            "caption_type": self.caption_type,
            "metadata_json": self.metadata_json,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
