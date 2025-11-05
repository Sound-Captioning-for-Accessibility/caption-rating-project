# Caption Rating Chrome Extension

A Chrome extension that allows users to rate caption quality directly on YouTube videos.

## Features

- 👍👎 Like/Dislike buttons in YouTube player controls
- ⭐ Detailed rating system with categories:
  - Overall Rating (1-5 stars)
  - Accuracy
  - Timing
  - NSI (Non-Speech Information)
  - Layout
- 💬 Optional feedback comments
- 🔄 Auto-syncs with backend database
- 📊 Videos appear on the Caption Rating website

## Installation

### Development Mode

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `caption-rating-extension2` folder

### Prerequisites

- Chrome browser (or Chromium-based browser)
- Backend API running at `http://localhost:5000` (default)

## How It Works

### User Flow

1. **Watch YouTube**: Browse to any YouTube video
2. **Rate Captions**: Click the like/dislike button added to the player controls
3. **Fill Form**: Rate caption quality across multiple dimensions
4. **Submit**: Rating is sent to backend and video is added to database
5. **View on Website**: Visit the Caption Rating website to see all rated videos

### Technical Flow

```
┌─────────────────────────────────────────┐
│   User watches YouTube video             │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   Clicks like/dislike button             │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   Rating form appears                    │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   User fills out ratings                 │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   Extension creates/gets user ID         │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   POST /api/videos/{videoID}             │
│   (Fetches YouTube metadata)             │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   POST /api/ratings                      │
│   (Submits rating)                       │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   Video appears on website               │
└─────────────────────────────────────────┘
```

## Configuration

### API Base URL

By default, the extension connects to `http://localhost:5000`.

To change this, set `window.CAPTION_RATING_API_BASE` before the extension loads.

### Permissions

The extension requires:
- **storage**: To save user ID across sessions
- **tabs**: To detect YouTube page changes
- **host_permissions**: 
  - `https://*.youtube.com/*` - To inject buttons and forms
  - `http://localhost:5000/*` - To communicate with backend API

## File Structure

```
caption-rating-extension2/
├── manifest.json          # Extension configuration
├── background.js          # Detects YouTube video changes
├── contentScript.js       # Injects like/dislike buttons
├── popup.js               # Rating form logic
├── popup.css              # Form styling
├── assets/                # Button images
│   ├── like.png
│   ├── like2.png
│   ├── dislike.png
│   └── dislike2.png
└── README.md (this file)
```

## Components

### background.js
- Listens for tab URL changes
- Detects when user navigates to YouTube video
- Sends message to content script

### contentScript.js
- Injects like/dislike buttons into YouTube player
- Positions buttons next to settings gear icon
- Triggers rating form on click

### popup.js
- Creates and displays rating form modal
- Handles star rating interactions
- Manages user ID (creates if doesn't exist)
- Submits ratings to backend API
- Handles form positioning (fullscreen vs normal)

## API Integration

### Endpoints Used

#### Create User
```http
POST /api/users/
Content-Type: application/json

{
  "email": "user1234567890@caption-rating.com"
}

Response: [{ "userID": 1, "email": "..." }]
```

#### Add Video
```http
POST /api/videos/{videoID}

Response: { videoID, title, channel, ... }
```

#### Submit Rating
```http
POST /api/ratings
Content-Type: application/json

{
  "userID": 1,
  "videoID": "dQw4w9WgXcQ",
  "overallRating": 5,
  "thumbsUp": true,
  "feedback": "Great captions!",
  "videoTimestamp": 42
}

Response: { ratingID: 1, ... }
```

## User Management

- User ID is created on first use
- Stored in `chrome.storage.local`
- Format: `user{timestamp}@caption-rating.com`
- Persists across browser sessions

## Development

### Testing Locally

1. Start the backend server:
```bash
cd backend
python api.py
```

2. Load the extension in Chrome (see Installation)

3. Navigate to any YouTube video

4. Click the thumbs up/down button

5. Fill out the form and submit

6. Check backend console for API calls

7. Visit `http://localhost:5173` to see videos

### Debugging

- Open Chrome DevTools on YouTube page
- Check Console tab for extension logs
- Check Network tab for API calls
- Inspect `chrome.storage.local` in Application tab

### Common Issues

**Buttons not appearing:**
- Check YouTube player loaded completely
- Look for `.ytp-right-controls` element
- Check console for injection errors

**API calls failing:**
- Verify backend is running on port 5000
- Check CORS is enabled in backend
- Inspect Network tab for error details

**Form positioning wrong:**
- Check if fullscreen vs normal mode
- Look for player container element
- Verify gear button exists as reference point

## Customization

### Change Button Images
Replace images in `assets/` folder with same names:
- `like.png` & `like2.png` - Filled like icon
- `dislike.png` & `dislike2.png` - Filled dislike icon

### Modify Rating Categories
Edit `popup.js` around line 54-95 to add/remove rating categories.

### Style the Form
Edit `popup.css` to customize colors, sizing, positioning.

## Production Deployment

### Prepare for Chrome Web Store

1. Update `manifest.json`:
```json
{
  "name": "Caption Rating",
  "version": "1.0.0",
  "description": "Rate caption quality on YouTube videos",
  "host_permissions": [
    "https://*.youtube.com/*",
    "https://your-api-domain.com/*"
  ]
}
```

2. Create icons (128x128, 48x48, 16x16)

3. Update API URL to production endpoint

4. Zip the extension folder

5. Upload to Chrome Web Store Developer Dashboard

### Security Considerations

- Never commit API keys to code
- Use HTTPS for production API
- Validate all user input
- Sanitize feedback text
- Rate limit API calls

## Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Edge (Chromium-based)
- ✅ Brave
- ❌ Firefox (different extension API)
- ❌ Safari (different extension API)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on YouTube
5. Submit a pull request

## License

See main project LICENSE file.

## Support

For issues or questions:
1. Check existing issues on GitHub
2. Review this README thoroughly
3. Check backend logs and browser console
4. Create a new issue with details

## Version History

### v0.1.0 (Current)
- Initial release
- Like/dislike buttons
- Multi-dimension rating system
- Backend integration
- User management
- Form positioning logic

## Roadmap

- [ ] Add more rating dimensions
- [ ] Support for other video platforms
- [ ] Offline rating queue
- [ ] Rating history viewer
- [ ] Keyboard shortcuts
- [ ] Customizable hotkeys
- [ ] Export ratings to CSV
- [ ] Dark mode support

