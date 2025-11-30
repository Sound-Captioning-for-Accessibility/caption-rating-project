from flask_restful import Resource, reqparse, fields, marshal_with, abort
from flask import request
from models import db, VideoModel, RatingModel
from youtube import fetchMetadata
from sqlalchemy import func

videos_args = reqparse.RequestParser()
videos_args.add_argument("videoID", type=str, required=True)

videoFields = {
    'videoID': fields.String,
    'title': fields.String,
    'channel': fields.String,
    'duration': fields.Integer,
    'thumbnail': fields.String,
    'created': fields.DateTime,
    'likes': fields.Integer,
    'views': fields.Integer,
    'captionLikes': fields.Integer,
    'averageRating': fields.Float,
    'ratingCount': fields.Integer,
    'language': fields.String,
    'showRating': fields.Boolean
}

class Videos(Resource):
    def get(self, videoID=None):
        if videoID:
            video = VideoModel.query.get(videoID)
            if not video:
                abort(404, "Video not found")
            
            # Calculate average rating
            rating_stats = db.session.query(
                func.avg(RatingModel.overallRating).label('avg'),
                func.count(RatingModel.ratingID).label('count')
            ).filter(RatingModel.videoID == videoID).first()
            
            video_dict = {
                'videoID': video.videoID,
                'title': video.title,
                'channel': video.channel,
                'duration': video.duration,
                'thumbnail': video.thumbnail,
                'created': video.created.isoformat() if video.created else None,
                'likes': video.likes,
                'views': video.views,
                'captionLikes': video.captionLikes,
                'averageRating': float(rating_stats.avg) if rating_stats.avg else 0.0,
                'ratingCount': rating_stats.count or 0,
                'language': video.language,
                'showRating': video.showRating if hasattr(video, 'showRating') else True
            }
            return video_dict
        else:
            videos = VideoModel.query.all()
            result = []
            
            for video in videos:
                # Calculate average rating for each video
                rating_stats = db.session.query(
                    func.avg(RatingModel.overallRating).label('avg'),
                    func.count(RatingModel.ratingID).label('count')
                ).filter(RatingModel.videoID == video.videoID).first()
                
                video_dict = {
                    'videoID': video.videoID,
                    'title': video.title,
                    'channel': video.channel,
                    'duration': video.duration,
                    'thumbnail': video.thumbnail,
                    'created': video.created.isoformat() if video.created else None,
                    'likes': video.likes,
                    'views': video.views,
                    'captionLikes': video.captionLikes,
                    'averageRating': float(rating_stats.avg) if rating_stats.avg else 0.0,
                    'ratingCount': rating_stats.count or 0,
                    'language': video.language,
                    'showRating': video.showRating if hasattr(video, 'showRating') else True
                }
                result.append(video_dict)
            
            return result
    
    def post(self, videoID):
        try:
            # Get showRating from request body, default to True
            try:
                request_data = request.get_json() or {}
            except Exception:
                request_data = {}
            show_rating = request_data.get('showRating', True)
            
            # Check if video already exists
            existing = VideoModel.query.get(videoID)
            if existing:
                # Update showRating if provided
                if 'showRating' in request_data:
                    existing.showRating = show_rating
                    db.session.commit()
                
                # Calculate rating stats for existing video
                rating_stats = db.session.query(
                    func.avg(RatingModel.overallRating).label('avg'),
                    func.count(RatingModel.ratingID).label('count')
                ).filter(RatingModel.videoID == videoID).first()
                
                return {
                    'videoID': existing.videoID,
                    'title': existing.title,
                    'channel': existing.channel,
                    'duration': existing.duration,
                    'thumbnail': existing.thumbnail,
                    'created': existing.created.isoformat() if existing.created else None,
                    'likes': existing.likes,
                    'views': existing.views,
                    'captionLikes': existing.captionLikes,
                    'averageRating': float(rating_stats.avg) if rating_stats.avg else 0.0,
                    'ratingCount': rating_stats.count or 0,
                    'language': existing.language,
                    'showRating': existing.showRating if hasattr(existing, 'showRating') else True
                }, 200
            
            # fetchMetadata will raise an exception if it fails
            try:
                metadata = fetchMetadata(videoID)
            except Exception as e:
                error_msg = str(e)
                if 'API key' in error_msg or 'YOUTUBE_API_KEY' in error_msg:
                    abort(500, message=f"YouTube API key not configured. Please set YOUTUBE_API_KEY environment variable. Original error: {error_msg}")
                elif 'not found' in error_msg.lower():
                    abort(404, message=f"Video {videoID} not found on YouTube. {error_msg}")
                else:
                    abort(500, message=f"Failed to fetch video metadata from YouTube: {error_msg}")
            
            video = VideoModel(
                videoID = videoID,
                title = metadata.get('title', 'Unknown'),
                channel = metadata.get('channel', 'Unknown'),
                duration = metadata.get('duration', 0),
                thumbnail = metadata.get('thumbnail', ''),
                created = metadata.get('created'),
                likes = metadata.get('likes', 0),
                views = metadata.get('views', 0),
                language = metadata.get('language', ''),
                showRating = show_rating
            )
            db.session.add(video)
            db.session.commit()
            
            return {
                'videoID': video.videoID,
                'title': video.title,
                'channel': video.channel,
                'duration': video.duration,
                'thumbnail': video.thumbnail,
                'created': video.created.isoformat() if video.created else None,
                'likes': video.likes,
                'views': video.views,
                'captionLikes': video.captionLikes,
                'averageRating': 0.0,
                'ratingCount': 0,
                'language': video.language,
                'showRating': video.showRating
            }, 201
        except Exception as e:
            db.session.rollback()
            abort(400, message=f"Failed to create video: {str(e)}")
    
    def delete(self, videoID):
        video = VideoModel.query.get(videoID)
        if not video:
            abort(404, "Video not found")
        db.session.delete(video)
        db.session.commit()
        return {"message": "Video deleted"}
