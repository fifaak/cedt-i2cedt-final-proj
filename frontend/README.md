# Frontend

Static web client for Thai Fortune Telling app with modern UI.

## Setup

```bash
cd frontend
npm install
npm start  # http://localhost:3000
```

Or for auto-restart during development:

```bash
npm run dev  # nodemon server.js
```

## Environment

Copy `env.example` to `.env` and adjust if needed:

```
PORT=3000
BACKEND_HOST=localhost
BACKEND_PORT=3001
# Optional override used by browser client (otherwise auto-detected)
# API_BASE=http://localhost:3001/api
```

## Development

- The frontend runs on port 3000 and proxies `/api` to the backend on port 3001 using Node's built-in `http` module (no extra proxy deps).
- Static assets are served from `public/` and ES modules from `src/`.
- API shapes are documented in `DATA_SCHEMA.md`.

## Features

### UI Components
- **Responsive sidebar** with user info form
- **Chat interface** with message bubbles and typing animations
- **Typing indicator** with animated dots while waiting for AI response
- **Typewriter effect** for AI responses with variable speed and natural pauses
- **Auto-resize textarea** for better input experience
- **Click-to-edit user message** to update prediction (PUT /fortune/:id)
- **Threaded chat history** grouped per user+topic from server data

### Technical
- **Vanilla JavaScript** - No frameworks
- **Express server** for static files and built-in proxy
- **MongoDB-backed only**: local/offline storage removed
- **Mobile responsive** design

## File Structure

```
public/
├── index.html         # Main HTML template (loads /src/main.js)
├── styles.css         # CSS styling with dark theme

src/
├── main.js            # App entry (ES modules)
├── state.js           # Central app state
├── constants.js       # Constants and helpers
├── dom.js             # DOM element access and menu bindings
├── ui.js              # UI rendering/typing helpers
├── api.js             # API detection and requests
├── storage.js         # Form helpers (getUserInfoFromForm)
└── history.js         # Chat history mapping/listing, session grouping
```