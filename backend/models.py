from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Database Models
class UserModel(db.Model):
    userID = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True)
    # User info to be added

class VideoModel(db.Model):
    videoID = db.Column(db.String(100), primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    channel = db.Column(db.String(250), nullable=False)
    duration = db.Column(db.Integer)
    thumbnail = db.Column(db.Text)
    created = db.Column(db.DateTime)
    likes = db.Column(db.Integer)
    views = db.Column(db.Integer)
    captionLikes = db.Column(db.Integer, default=0)
    language = db.Column(db.String(100))
    showRating = db.Column(db.Boolean, default=True)

class RatingModel(db.Model):
    ratingID = db.Column(db.Integer, primary_key=True)
    userID = db.Column(db.Integer, db.ForeignKey('user_model.userID'))
    videoID = db.Column(db.String(100), db.ForeignKey('video_model.videoID'))
    thumbsUp = db.Column(db.Boolean, nullable=False)
    overallRating = db.Column(db.Integer)
    feedback = db.Column(db.Text)
    submittedAt = db.Column(db.DateTime, default=datetime.utcnow)
    videoTimestamp = db.Column(db.Integer)
    # Dimension ratings to be added