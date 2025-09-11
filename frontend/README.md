# Frontend Client

Express.js server serving the Thai Fortune Telling app frontend.

## Setup

```bash
npm install
npm start
```

For development with auto-restart:
```bash
npm run dev
```

Runs on `http://localhost:3000`

## Structure

- `app.js` - Express server
- `index.html` - Main HTML file
- `public/` - Static assets (CSS, JS)
  - `styles.css` - Application styles
  - `scripts.js` - Client-side JavaScript

## Configuration

Backend API should run on `http://localhost:3001`. To change API endpoint, update `API_BASE` in `public/scripts.js`:

```javascript
const API_BASE = 'http://localhost:3001/api';
```