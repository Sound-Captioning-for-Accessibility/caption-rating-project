import re
import requests
import time
from pathlib import Path

# API base URL
API_BASE = 'http://127.0.0.1:5000'

def extract_video_id(url):
    """Extract video ID from YouTube URL"""
    # Match patterns like ?v=VIDEO_ID or /watch?v=VIDEO_ID
    match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', url)
    if match:
        return match.group(1)
    return None

def add_video(video_id):
    """Add a video to the database via API"""
    try:
        response = requests.post(
            f'{API_BASE}/api/videos/{video_id}',
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        if response.status_code in [200, 201]:
            data = response.json()
            return True, data.get('title', 'Unknown')
        else:
            error = response.json().get('message', f'Status {response.status_code}')
            return False, error
    except Exception as e:
        return False, str(e)

def safe_print(text):
    """Print text safely handling Unicode characters"""
    try:
        print(text)
    except UnicodeEncodeError:
        # Replace problematic characters
        print(text.encode('ascii', 'replace').decode('ascii'))

def main():
    # Read the file
    file_path = Path(r'C:\Users\naevi\Downloads\top_25_percent_videos.txt')
    
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        return
    
    print(f"Reading video URLs from: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        urls = [line.strip() for line in f if line.strip()]
    
    print(f"Found {len(urls)} video URLs")
    print(f"Starting to add videos to database...")
    print(f"API endpoint: {API_BASE}/api/videos/")
    print("-" * 60)
    
    success_count = 0
    error_count = 0
    skipped_count = 0
    
    for i, url in enumerate(urls, 1):
        video_id = extract_video_id(url)
        if not video_id:
            safe_print(f"[{i}/{len(urls)}] Skipped: Invalid URL format - {url}")
            skipped_count += 1
            continue
        
        print(f"[{i}/{len(urls)}] Processing: {video_id}...", end=' ', flush=True)
        success, result = add_video(video_id)
        
        if success:
            safe_print(f"OK - Added: {result}")
            success_count += 1
        else:
            safe_print(f"ERROR - {result}")
            error_count += 1
        
        # Small delay to avoid rate limiting
        if i % 10 == 0:
            time.sleep(1)
    
    print("-" * 60)
    print(f"\nSummary:")
    print(f"  Successfully added: {success_count}")
    print(f"  Errors: {error_count}")
    print(f"  Skipped (invalid URLs): {skipped_count}")
    print(f"  Total processed: {len(urls)}")

if __name__ == '__main__':
    main()

