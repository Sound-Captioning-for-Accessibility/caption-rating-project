from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api
from flask_cors import CORS
from resources.users import Users, User
from resources.videos import Videos
from resources.ratings import Ratings

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///captionratings.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app, resources={r"/api/*": {"origins": "*"}})
api = Api(app)

from models import db
db.init_app(app)

api.add_resource(Users, '/api/users/')
api.add_resource(User, '/api/users/<int:userID>')
api.add_resource(Videos, '/api/videos/<string:videoID>', '/api/videos')
api.add_resource(Ratings, '/api/ratings/<int:ratingID>', '/api/ratings')


@app.route("/")
def home ():
    return "Caption Rating API"

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)