from api import app
from models import db, VideoModel, RatingModel, UserModel

with app.app_context():
    print("Clearing database...")
    
    # Drop all tables
    db.drop_all()
    print("Dropped all tables")
    
    # Recreate all tables
    db.create_all()
    print("Created fresh tables")
    
    print("\n✅ Database cleared successfully!")
    print("All videos, ratings, and users have been removed.")
    print("Refresh your website to see the empty state.")

