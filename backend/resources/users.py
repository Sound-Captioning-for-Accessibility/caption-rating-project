from flask_restful import Resource, reqparse, fields, marshal_with, abort
from models import db, UserModel

user_args = reqparse.RequestParser()
user_args.add_argument('email', type=str, required=True)
user_args.add_argument('displayName', type=str, required=False)

userFields = {
    'userID': fields.Integer,
    'email': fields.String,
    'displayName': fields.String,
}

class Users(Resource):
    @marshal_with(userFields)
    def get(self):
        users = UserModel.query.all()
        return users
    
    @marshal_with(userFields)
    def post(self):
        try:
            args = user_args.parse_args()
            display_name = getattr(args, 'displayName', None)
            user = UserModel(email=args["email"], displayName=display_name)
            db.session.add(user)
            db.session.commit()
            users = UserModel.query.all()
            return users, 201
        except Exception as e:
            db.session.rollback()
            abort(400, message=f"Failed to create user: {str(e)}")
    
class User(Resource):
    @marshal_with(userFields)
    def get(self, userID):
        user = UserModel.query.get(userID)
        if not user:
            abort(404, "User not found")
        return user

    def delete(self, userID):
        user = UserModel.query.get(userID)
        if not user:
            abort(404, "User not found")
        db.session.delete(user)
        db.session.commit()
        return {"message": "User deleted"}
    
    @marshal_with(userFields)
    def patch(self, userID):
        args = user_args.parse_args()
        user = UserModel.query.get(userID)
        if not user:
            abort(404, "User not found")
        user.email = args["email"]
        display_name = getattr(args, 'displayName', None)
        if display_name is not None:
            user.displayName = display_name
        db.session.commit()
        return user
        