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
- **MongoDB-backed only**: local/offline storage removed
- **Mobile responsive** design

## File Structure

```
public/
├── index.html         # Main HTML template (loads /src/main.js)
├── styles.css         # CSS styling with dark theme
└── styles/            # Extra responsive styles (optional)

src/
├── main.js            # App entry (ES modules)
├── state.js           # Central app state
├── constants.js       # Constants and helpers
├── dom.js             # DOM element access and menu bindings
├── ui.js              # UI rendering/typing helpers
├── api.js             # API detection and requests
├── storage.js         # localStorage helpers
├── history.js         # Chat history mapping/listing
└── sync.js            # Background sync logic
```

## Development

The frontend runs on port 3000 and proxies API calls to the backend on port 3001.