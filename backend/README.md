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
MONGODB_URI=mongodb://localhost:27017/fortune_telling
TYPHOON_API_KEY=your_api_key_here
```

## API Endpoints

- `POST /api/fortune` - Create fortune reading
- `GET /api/fortune` - Get all fortunes
- `GET /api/fortune/:id` - Get specific fortune
- `PUT /api/fortune/:id` - Update fortune
- `DELETE /api/fortune/:id` - Delete fortune
- `POST /api/chat` - Chat with AI fortune teller
