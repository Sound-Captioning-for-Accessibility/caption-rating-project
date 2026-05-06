from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from rgt.extensions import RGTBase


class ComparisonAnswer(RGTBase):
    __tablename__ = "comparison_answer"

    id = Column(Integer, primary_key=True)
    comparison_response_id = Column(Integer, ForeignKey("comparison_response.id"), nullable=False)
    question_key = Column(String(100), nullable=False)
    answer_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    comparison_response = relationship("ComparisonResponse", backref="answers")

    def to_dict(self):
        return {
            "id": self.id,
            "comparison_response_id": self.comparison_response_id,
            "question_key": self.question_key,
            "answer_text": self.answer_text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
