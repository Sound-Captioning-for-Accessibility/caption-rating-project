from flask_restful import Resource, reqparse, fields, marshal_with, abort
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
    'language': fields.String
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
                'language': video.language
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
                    'language': video.language
                }
                result.append(video_dict)
            
            return result
    
    def post(self, videoID):
        # Check if video already exists
        existing = VideoModel.query.get(videoID)
        if existing:
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
                'averageRating': 0.0,
                'ratingCount': 0,
                'language': existing.language
            }, 200
        
        metadata = fetchMetadata(videoID)
        video = VideoModel(
            videoID = videoID,
            title = metadata['title'],
            channel = metadata['channel'],
            duration = metadata['duration'],
            thumbnail = metadata['thumbnail'],
            created = metadata['created'],
            likes = metadata['likes'],
            views = metadata['views'],
            language = metadata['language']
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
            'language': video.language
        }, 201
    
    def delete(self, videoID):
        video = VideoModel.query.get(videoID)
        if not video:
            abort(404, "Video not found")
        db.session.delete(video)
        db.session.commit()
        return {"message": "Video deleted"}
