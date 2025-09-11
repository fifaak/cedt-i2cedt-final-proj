# Backend API

Express.js API server for Thai Fortune Telling app.

## Setup

```bash
npm install
npm run dev
```

## Environment (.env)

```
PORT=3001
MONGODB_URI=MONGODB_URI
TYPHOON_API_KEY=TYPHOON_API_KEY
```

## API Endpoints

- `POST /api/fortune` - Create fortune reading
- `GET /api/fortune` - Get all fortunes
- `GET /api/fortune/:id` - Get specific fortune
- `PUT /api/fortune/:id` - Update fortune
- `DELETE /api/fortune/:id` - Delete fortune
- `POST /api/chat` - Chat with AI fortune teller
