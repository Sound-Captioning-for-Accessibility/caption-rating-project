import os
from pathlib import Path
from urllib.parse import unquote
from api import app
from models import db, VideoModel, RatingModel, UserModel

with app.app_context():
    print("Clearing database...")
    
    db.session.close()
    db.engine.dispose()
    
    database_uri = str(db.engine.url)
    
    # Extract the database file path from the SQLite URI
    if database_uri.startswith('sqlite:///'):
        # Remove 'sqlite:///' prefix and decode URL encoding
        db_path = unquote(database_uri.replace('sqlite:///', ''))
        
        # Handle absolute paths (starting with /) and relative paths
        if os.path.isabs(db_path):
            db_file = Path(db_path)
        else:
            # Check both the backend directory and instance folder
            backend_dir = Path(__file__).parent
            instance_dir = backend_dir / 'instance'
            
            # Try instance folder first (Flask default)
            db_file_instance = instance_dir / db_path
            db_file_backend = backend_dir / db_path
            
            # Use the one that exists, or instance folder as default
            if db_file_instance.exists():
                db_file = db_file_instance
            elif db_file_backend.exists():
                db_file = db_file_backend
            else:
                db_file = db_file_instance
        
        print(f"Database file path: {db_file}")
        
        # Also check for database files in common locations
        backend_dir = Path(__file__).parent
        possible_locations = [
            db_file,
            backend_dir / 'instance' / 'captionratings.db',
            backend_dir / 'captionratings.db',
        ]
        
        # Delete all found database files
        deleted_any = False
        for db_location in possible_locations:
            if db_location.exists():
                try:
                    db_location.unlink()
                    print(f"Deleted database file: {db_location}")
                    deleted_any = True
                except PermissionError:
                    print(f"Error: Database file is locked at {db_location}")
                    print(f"  Please stop the Flask app and try again.")
                except Exception as e:
                    print(f"Warning: Could not delete {db_location}: {e}")
        
        if not deleted_any:
            print("No database files found to delete (database may already be empty)")
        
        # Delete SQLite journal files from all possible locations
        for db_location in possible_locations:
            journal_files = [
                Path(str(db_location) + '-journal'),
                Path(str(db_location) + '-wal'),
                Path(str(db_location) + '-shm')
            ]
            
            for journal_file in journal_files:
                if journal_file.exists():
                    try:
                        journal_file.unlink()
                        print(f"Deleted journal file: {journal_file.name}")
                    except Exception as e:
                        pass
    
    # Now drop all tables and recreate them to ensure they're empty
    db.drop_all()
    db.create_all()
    print("\nDropped all tables and created fresh empty tables")
    
    print("\nDatabase cleared successfully!")
    print("All videos, ratings, and users have been removed.")
    print("The database file has been deleted and recreated.")
    print("\nRefresh your website to see the empty state.")



