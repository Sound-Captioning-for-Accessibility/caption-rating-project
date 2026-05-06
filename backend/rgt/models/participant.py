from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from rgt.extensions import RGTBase


class Participant(RGTBase):
    __tablename__ = "participant"

    id = Column(Integer, primary_key=True)
    token = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "token": self.token,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
