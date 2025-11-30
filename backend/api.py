from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api
from flask_cors import CORS
from resources.users import Users, User
from resources.videos import Videos
from resources.ratings import Ratings

app = Flask(__name__)
import os
from pathlib import Path

backend_dir = Path(__file__).parent.absolute()
instance_path = backend_dir / 'instance'
instance_path.mkdir(exist_ok=True)
db_path = instance_path / 'captionratings.db'
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path.absolute()}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Enable CORS for all API routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

api = Api(app)

from models import db
db.init_app(app)

@app.route('/api/ratings', methods=['POST'])
def create_rating():
    from flask_restful import reqparse
    from models import db, RatingModel, UserModel, VideoModel
    
    try:
        # Parse request data
        data = request.get_json() or {}
        
        # Validate required fields
        if 'userID' not in data or 'videoID' not in data or 'overallRating' not in data:
            return jsonify({'message': 'Missing required fields: userID, videoID, overallRating'}), 400
        
        userID = int(data['userID'])
        videoID = str(data['videoID'])
        overallRating = int(data['overallRating'])
        
        # Validate overallRating
        if overallRating < 1 or overallRating > 5:
            return jsonify({'message': 'overallRating must be between 1 and 5'}), 400
        
        # Validate user exists
        user = UserModel.query.get(userID)
        if not user:
            return jsonify({'message': f'User with ID {userID} not found'}), 404
        
        # Validate video exists
        video = VideoModel.query.get(videoID)
        if not video:
            return jsonify({'message': f'Video with ID {videoID} not found'}), 404
        
        # Get optional fields with safe defaults
        feedback = str(data.get('feedback') or '') if data.get('feedback') is not None else ''
        thumbsUp = bool(data.get('thumbsUp', False))
        videoTimestamp = int(data.get('videoTimestamp', 0))
        
        # Create rating
        rating = RatingModel(
            userID=userID,
            videoID=videoID,
            overallRating=overallRating,
            feedback=feedback,
            thumbsUp=thumbsUp,
            videoTimestamp=videoTimestamp
        )
        db.session.add(rating)
        
        # Update caption likes if thumbs up
        if thumbsUp:
            video.captionLikes = (video.captionLikes or 0) + 1
        
        db.session.commit()
        
        return jsonify({
            'ratingID': rating.ratingID,
            'userID': rating.userID,
            'videoID': rating.videoID,
            'overallRating': rating.overallRating,
            'feedback': rating.feedback,
            'thumbsUp': rating.thumbsUp,
            'videoTimestamp': rating.videoTimestamp,
            'submittedAt': rating.submittedAt.isoformat() if rating.submittedAt else None
        }), 201
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'message': f'Invalid data: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create rating: {str(e)}'}), 400

api.add_resource(Users, '/api/users/')
api.add_resource(User, '/api/users/<int:userID>')
api.add_resource(Videos, '/api/videos/<string:videoID>', '/api/videos')
api.add_resource(Ratings, '/api/ratings/<int:ratingID>', '/api/ratings')

@app.route("/")
def home ():
    return "Caption Rating API"

@app.route("/api/health")
def health():
    return {"status": "ok", "message": "API is running"}, 200

@app.route("/api/routes")
def list_routes():
    """Debug endpoint to see all registered routes"""
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'rule': str(rule)
        })
    return jsonify({'routes': routes}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        if db_path.exists():
            print(f"  Size: {db_path.stat().st_size:,} bytes")
            from models import VideoModel
            video_count = VideoModel.query.count()
            print(f"  Videos in database: {video_count}")
        print(f"{'='*60}\n")
    app.run(host='127.0.0.1', port=5000, debug=True)