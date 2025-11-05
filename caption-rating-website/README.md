# Caption Rating Frontend

React frontend for the Caption Rating application. This application allows users to add YouTube videos, browse them, and rate their caption quality.

## Features

- 🔍 Add YouTube videos by URL or ID
- 📹 Browse and search videos
- ⭐ Rate video captions
- 📊 View video statistics
- 🎨 Modern, responsive UI

## Prerequisites

- Node.js 16+ and npm
- Backend server running (see `../backend/`)

## Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create `.env` file to customize API URL:
```bash
cp .env.example .env
```

Edit `.env` and set your backend URL if different from default:
```
VITE_API_URL=http://localhost:5000
```

## Development

Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:5173`

## Building for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── App.jsx                 # Main application component
├── config.js              # API configuration
├── services/
│   └── api.js            # API service layer
└── components/
    ├── Header.jsx         # Navigation header
    ├── SearchBar.jsx      # Video search/add
    ├── VideosPage.jsx     # Video browsing page
    ├── VideoPlayer.jsx    # Video player with rating
    ├── VideoSection.jsx   # Video section container
    ├── VideoCard.jsx      # Individual video card
    ├── LearnPage.jsx      # Information page
    └── Footer.jsx         # Footer component
```

## API Integration

This frontend communicates with the Flask backend through REST API calls. See `src/services/api.js` for available API functions:

- **Video API**: Add, fetch, and manage videos
- **Rating API**: Create, update, and retrieve ratings
- **User API**: Manage user sessions

## Technologies Used

- **React** - UI library
- **Vite** - Build tool and dev server
- **CSS3** - Styling
- **Fetch API** - HTTP requests

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Usage

### Adding a Video

1. Paste a YouTube video URL or ID in the search bar on the home page
2. Click the add button
3. Wait for the video to be processed
4. Video appears in the grid

### Rating a Video

1. Click on any video card
2. Video player modal opens
3. Watch the video and evaluate captions
4. Fill out the rating form:
   - Choose thumbs up/down
   - Set overall rating (1-10)
   - Add optional feedback
   - Specify a video timestamp
5. Submit the rating

### Browsing Videos

1. Go to "Videos" page from navigation
2. Use search to filter by title/channel
3. Sort by highest rated, most recent, or most views
4. Click "Load More" to see additional videos

## Configuration

### API URL

Set the backend API URL in `.env`:
```
VITE_API_URL=http://localhost:5000
```

### Build Configuration

Vite configuration is in `vite.config.js`. Customize as needed for your deployment environment.

## Troubleshooting

### API Connection Failed

**Problem:** Frontend can't reach backend  
**Solution:** 
- Ensure backend server is running on port 5000
- Check CORS is enabled in backend
- Verify API URL in `.env` or `config.js`

### Videos Not Loading

**Problem:** Videos list is empty  
**Solution:**
- Add videos using the search bar
- Check browser console for errors
- Verify backend has YouTube API key configured

### Rating Submission Failed

**Problem:** Rating doesn't submit  
**Solution:**
- Check browser console for errors
- Ensure user session is initialized
- Verify all required fields are filled

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

See main project LICENSE file.
