from flask_restful import Resource, reqparse, fields, marshal_with, abort
from models import db, RatingModel, UserModel, VideoModel

rating_args = reqparse.RequestParser()
rating_args.add_argument('userID', type=int, required=True)
rating_args.add_argument('videoID', type=str, required=True)
rating_args.add_argument('overallRating', type=int, required=True)
rating_args.add_argument('feedback', type=str, required=False, default='')
rating_args.add_argument('thumbsUp', type=bool, required=True)
rating_args.add_argument('videoTimestamp', type=int, required=True)

ratingFields = {
    'ratingID': fields.Integer,
    'userID': fields.Integer,
    'videoID': fields.String,
    'overallRating': fields.Integer,
    'feedback': fields.String,
    'thumbsUp': fields.Boolean,
    'submittedAt': fields.DateTime,
    'videoTimestamp': fields.Integer,
}

class Ratings(Resource):
    @marshal_with(ratingFields)
    def get(self, ratingID=None):
        if ratingID:
            rating = RatingModel.query.get(ratingID)
            if not rating:
                abort(404, "Rating not found")
            return rating
        else:
            ratings = RatingModel.query.all()
            return ratings
        
    @marshal_with(ratingFields)
    def post(self):
        try:
            args = rating_args.parse_args()
            
            # Validate user exists
            user = UserModel.query.get(args["userID"])
            if not user:
                abort(404, message=f"User with ID {args['userID']} not found")
            
            # Validate video exists
            video = VideoModel.query.get(args["videoID"])
            if not video:
                abort(404, message=f"Video with ID {args['videoID']} not found. Please add video first using POST /api/videos/{args['videoID']}")
            
            # Validate thumbsUp is boolean
            thumbs_up = args.get('thumbsUp', False)
            if not isinstance(thumbs_up, bool):
                # Try to convert string booleans
                if isinstance(thumbs_up, str):
                    thumbs_up = thumbs_up.lower() in ('true', '1', 'yes')
                else:
                    thumbs_up = bool(thumbs_up)
            
            # Validate videoTimestamp is a valid integer
            video_timestamp = args.get('videoTimestamp', 0)
            try:
                video_timestamp = int(video_timestamp)
                if video_timestamp < 0:
                    video_timestamp = 0
            except (ValueError, TypeError):
                video_timestamp = 0
            
            # Get feedback, default to empty string
            feedback = args.get('feedback', '') or ''
            if not isinstance(feedback, str):
                feedback = str(feedback)
            
            rating = RatingModel(
                userID = args["userID"],
                videoID = args["videoID"],
                overallRating = overall_rating,
                feedback = feedback,
                thumbsUp = thumbs_up,
                videoTimestamp = video_timestamp
            )
            db.session.add(rating)
            
            # Update caption likes count if thumbs up
            if thumbs_up:
                video.captionLikes = (video.captionLikes or 0) + 1
            
            db.session.commit()
            return rating, 201
        except Exception as e:
            db.session.rollback()
            # Provide more detailed error messages
            error_msg = str(e)
            if "not found" in error_msg.lower():
                abort(404, message=error_msg)
            elif "required" in error_msg.lower() or "invalid" in error_msg.lower():
                abort(400, message=error_msg)
            else:
                abort(400, message=f"Failed to create rating: {error_msg}")
    
    @marshal_with(ratingFields)
    def patch(self, ratingID):
        args = rating_args.parse_args()
        rating = RatingModel.query.get(ratingID)
        if not rating:
            abort(404, "Rating not found")
        
        # Track if thumbsUp changed
        old_thumbs_up = rating.thumbsUp
        new_thumbs_up = args["thumbsUp"]
        
        rating.overallRating = args["overallRating"]
        rating.feedback = args["feedback"]
        rating.thumbsUp = new_thumbs_up
        
        # Update caption likes if thumbsUp changed
        if old_thumbs_up != new_thumbs_up:
            video = VideoModel.query.get(rating.videoID)
            if video:
                if new_thumbs_up:
                    # Changed from down to up
                    video.captionLikes = (video.captionLikes or 0) + 1
                else:
                    # Changed from up to down
                    video.captionLikes = max((video.captionLikes or 0) - 1, 0)
        
        db.session.commit()
        return rating
    
    def delete(self, ratingID):
        rating = RatingModel.query.get(ratingID)
        if not rating:
            abort(404, "Rating not found")
        
        # Decrement caption likes if this was a thumbs up
        if rating.thumbsUp:
            video = VideoModel.query.get(rating.videoID)
            if video:
                video.captionLikes = max((video.captionLikes or 0) - 1, 0)
        
        db.session.delete(rating)
        db.session.commit()
        return {"message": "Rating deleted"}, 200
        
