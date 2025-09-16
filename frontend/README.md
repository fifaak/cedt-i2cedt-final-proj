# Frontend

Static web client for Thai Fortune Telling app with modern UI.

## Setup

```bash
npm install
npm start
```

## Features

### UI Components
- **Responsive sidebar** with user info form
- **Chat interface** with message bubbles and typing animations
- **Typing indicator** with animated dots while waiting for AI response
- **Typewriter effect** for AI responses with variable speed and natural pauses
- **Auto-resize textarea** for better input experience
- **Message actions** (edit/resend) with improved positioning
- **Chat history** with local storage and sync

### Technical
- **Vanilla JavaScript** - No frameworks
- **Express server** for static files and API proxy
- **Local storage** for offline functionality
- **Auto-sync** with backend when available
- **Mobile responsive** design

## File Structure

```
public/
├── index.html    # Main HTML template
├── styles.css    # CSS styling with dark theme
└── scripts.js    # JavaScript functionality
```

## Development

The frontend runs on port 3000 and proxies API calls to the backend on port 3001.