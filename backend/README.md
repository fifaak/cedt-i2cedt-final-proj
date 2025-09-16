# Backend - Fortune Chat (Express + Mongo + Typhoon)

This service exposes a chat backend with conversation history stored in MongoDB and responses generated via Typhoon.

## Tech stack (server only)

- express
- mongoose
- dotenv
- cors

## Project structure

```
backend/
  config/
    db.js                # Mongo connection helper
  controllers/
    chatController.js    # create/history/edit handlers
  models/
    ChatMessage.js       # Mongoose schema
  routes/
    chat.js              # Express router for /api/chat
  services/
    typhoonClient.js     # Typhoon API call using fetch
  scripts/
    test_api.sh          # Curl smoke tests (auto-starts server)
  server.js              # App entry, CORS/JSON + routes + Mongo connect
  package.json
```

## Environment variables

- `PORT` (default 3001)
- `MONGO_URI` MongoDB connection string. Defaults to `mongodb://127.0.0.1:27017/fortune_chat` if unset.
- `TYPHOON_API_KEY` Typhoon API key (required for live responses)
- `TYPHOON_MODEL` (default `typhoon-v2.1-12b-instruct`)

Create a `.env` (see `.env.example` in repo root if present) and set at least `TYPHOON_API_KEY`.

## Install & run

```bash
cd backend
npm install
npm start   # starts server on PORT (default 3001)
```

## Scripts

- `npm start`: start the server
- `npm run dev`: run API smoke tests via `scripts/test_api.sh`

The test script will:
- start the server if not already running (on `http://127.0.0.1:3001`)
- POST a sample chat, GET history, and PUT an edit

## API

- POST `/api/chat` Create a new chat message
- GET `/api/chat/history?name=...&birthdate=YYYY-MM-DD` Get history for user
- PUT `/api/chat/:id` Edit a previous user message
- GET `/health` Healthcheck → `{ "status": "ok" }`

### Request body (POST /api/chat)

```json
{
  "userInfo": {
    "name": "Alice",
    "birthdate": "1995-05-20",
    "sex": "female",
    "topic": "career"
  },
  "message": "งานปีนี้จะก้าวหน้าไหม?"
}
```

### Typhoon prompt format

The server builds `messages` as:

```
[
  { "role": "system", "content": "...includes user information in Thai persona..." },
  // prior user turns for this user (as {role:"user", content})
  { "role": "user", "content": "latest user message" }
]
```

For a follow-up like `แล้วความรักล่ะ?`, the server appends another `{role:"user"}` in order after prior turns, matching the required Typhoon schema.

### Example curls

Create message
```bash
curl -X POST "http://localhost:3001/api/chat" \
  -H 'Content-Type: application/json' \
  -d '{
    "userInfo": {"name":"Alice","birthdate":"1995-05-20","sex":"female","topic":"career"},
    "message": "ปีนี้งานจะก้าวหน้าไหม?"
  }'
```

Get history
```bash
curl "http://localhost:3001/api/chat/history?name=Alice&birthdate=1995-05-20"
```

Edit message
```bash
curl -X PUT "http://localhost:3001/api/chat/REPLACE_ID" \
  -H 'Content-Type: application/json' \
  -d '{"newMessage":"ถ้าเปลี่ยนงานตอนนี้เหมาะไหม?"}'
```

## Data model (Mongo)

Collection: `chatmessages`

```json
{
  "userInfo": {
    "name": "string",
    "birthdate": "YYYY-MM-DD",
    "sex": "male|female|other",
    "topic": "overall|career|finance|love|health"
  },
  "systemPrompt": "string",
  "userMessage": "string",
  "assistantResponse": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Frontend integration notes

- Base URL: `http://localhost:${PORT}` (default `http://localhost:3001`)
- CORS is enabled broadly (`app.use(cors())`).
- Send user info and the latest message; backend will include prior user turns automatically.
