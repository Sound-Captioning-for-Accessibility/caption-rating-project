from dotenv import load_dotenv
from googleapiclient.discovery import build
import os
from isodate import parse_duration
from datetime import datetime

load_dotenv()
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def fetchMetadata(videoID):
    try:
        if not YOUTUBE_API_KEY:
            raise ValueError("YouTube API key is not set. Please set YOUTUBE_API_KEY environment variable.")
        
        youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)
        request = youtube.videos().list(part="snippet, contentDetails, statistics", id=videoID)
        response = request.execute()

        if not response.get("items") or len(response["items"]) == 0:
            raise ValueError(f"Video {videoID} not found on YouTube")

        video = response["items"][0]
        snippet = video["snippet"]
        details = video["contentDetails"]
        stats = video["statistics"]

        # Get thumbnail
        thumbnails = snippet.get('thumbnails', {})
        thumbnail_url = (
            thumbnails.get('maxres', {}).get('url') or
            thumbnails.get('high', {}).get('url') or
            thumbnails.get('medium', {}).get('url') or
            thumbnails.get('default', {}).get('url') or
            ''
        )
        
        return {
            "title": snippet.get('title', 'Unknown'),
            "channel": snippet.get('channelTitle', 'Unknown'),
            "duration": int(parse_duration(details['duration']).total_seconds()) if details.get('duration') else 0,
            "thumbnail": thumbnail_url,
            "created": datetime.fromisoformat(snippet['publishedAt'].replace("Z", "+00:00")) if snippet.get('publishedAt') else datetime.utcnow(),
            "likes": int(stats.get('likeCount', 0)) if stats.get('likeCount') else 0,
            "views": int(stats.get('viewCount', 0)) if stats.get('viewCount') else 0,
            "language": snippet.get('defaultAudioLanguage', 'en')
        }
    except Exception as e:
        raise Exception(f"Failed to fetch YouTube metadata: {str(e)}")
