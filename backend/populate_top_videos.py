
import requests
import re
import time
from pathlib import Path

# API endpoint: use dev backend when testing locally
import os
API_BASE_URL = os.environ.get("CAPTION_RATING_API", "http://127.0.0.1:5000/api/videos")

def extract_video_id(url):
    # Pattern to match YouTube video IDs
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def read_video_urls(file_path):
    video_urls = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and line.startswith('http'):
                video_urls.append(line)
    return video_urls

def add_video(video_id, show_rating=False):
    try:
        url = f"{API_BASE_URL.rstrip('/')}/{video_id}"
        response = requests.post(
            url,
            json={"showRating": show_rating},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"[OK] Added/Updated: {data.get('title', video_id)[:50]}...")
            return True
        else:
            print(f"[FAIL] {video_id}: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"[ERR] {video_id}: {str(e)}")
        return False

def main():
    import sys
    
    # Allow file path to be passed as command line argument, or use default
    if len(sys.argv) > 1:
        file_path = Path(sys.argv[1])
    else:
        # Default: look for file in current directory, or Downloads if Windows path exists
        default_paths = [
            Path("top_25_percent_videos.txt"),  # Current directory
            Path("/opt/caption-rating/top_25_percent_videos.txt"),  # Linux common location
            Path("~/Downloads/top_25_percent_videos.txt").expanduser(),  # User Downloads
            Path(r"C:\Users\naevi\Downloads\top_25_percent_videos.txt") if sys.platform == "win32" else None  # Windows fallback
        ]
        
        file_path = None
        for path in default_paths:
            if path and path.exists():
                file_path = path
                break
        
        if not file_path:
            print("Error: Video URLs file not found.")
            print("\nUsage: python populate_top_videos.py [path_to_file.txt]")
            print("\nPlease provide the path to your video URLs file:")
            print("  python populate_top_videos.py /path/to/your/video_urls.txt")
            print("\nOr place 'top_25_percent_videos.txt' in the current directory.")
            return
    
    if not file_path.exists():
        print(f"Error: File not found at {file_path}")
        print("Please ensure the file path is correct.")
        print("\nUsage: python populate_top_videos.py [path_to_file.txt]")
        return
    
    print(f"Reading video URLs from {file_path}...")
    video_urls = read_video_urls(file_path)
    print(f"Found {len(video_urls)} video URLs\n")
    
    # Extract video IDs
    video_ids = []
    for url in video_urls:
        video_id = extract_video_id(url)
        if video_id:
            video_ids.append(video_id)
        else:
            print(f"Warning: Could not extract video ID from: {url}")
    
    print(f"Extracted {len(video_ids)} video IDs\n")
    print("Starting to add videos to database...")
    print("(Videos will be added with showRating=False)\n")
    
    # Add videos with showRating=False
    success_count = 0
    fail_count = 0
    
    for i, video_id in enumerate(video_ids, 1):
        print(f"[{i}/{len(video_ids)}] Processing {video_id}...", end=" ")
        if add_video(video_id, show_rating=False):
            success_count += 1
        else:
            fail_count += 1
        
        time.sleep(0.1)
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Total videos: {len(video_ids)}")
    print(f"  Successfully added: {success_count}")
    print(f"  Failed: {fail_count}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()

