# Backend - Fortune Chat (Express + Mongo + Typhoon)

This service exposes a chat and fortune backend with conversation history stored in MongoDB and responses generated via Typhoon.

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
    fortuneController.js # CRUD + predict for fortunes
  models/
    ChatMessage.js       # Mongoose schema
    Fortune.js           # Mongoose schema
  routes/
    chat.js              # Express router for /api/chat
    fortune.js           # Express router for /api/fortune
  services/
    typhoonClient.js     # Typhoon API call using fetch
  scripts/
    test_api.sh          # Curl smoke tests (auto-starts server)
  server.js              # App entry, CORS/JSON + routes + Mongo connect
  package.json
```

## Environment variables

- `PORT` (default 3001)
- `MONGO_URI` or `MONGODB_URI` MongoDB connection string. Defaults to `mongodb://127.0.0.1:27017/fortune_chat` if unset.
- `TYPHOON_API_KEY` Typhoon API key (required for live responses)
- `TYPHOON_MODEL` (default `typhoon-v2.1-12b-instruct`)

Create a `.env` and set at least `TYPHOON_API_KEY`.

## Install & run

```bash
cd backend
npm install
npm start   # starts server on PORT (default 3001)
```

## Scripts

- `npm start`: start the server
- `npm run dev`: run API smoke tests via `scripts/test_api.sh` (auto-starts server on 127.0.0.1:3001)
- `npm run simple`: start a minimal in-memory chat server (no MongoDB)

The dev test script will:
- start the server if not already running (on `http://127.0.0.1:3001`)
- POST a sample chat, GET history, and PUT an edit

## Healthcheck

- GET `/health` → `{ "status": "OK" }`

## APIs

### Chat APIs (`/api/chat`)

- POST `/api/chat` Create a new chat message
- GET `/api/chat/history?name=...&birthdate=YYYY-MM-DD&limit=100` Get history for user (optional `limit`, max 200)
- PUT `/api/chat/:id` Edit a previous user message

#### Request body (POST /api/chat)

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

#### Typhoon prompt format

The server builds `messages` as:

```
[
  { "role": "system", "content": "...persona with user info..." },
  // prior user turns for this user (as {role:"user", content})
  { "role": "user", "content": "latest user message" }
]
```

### Fortune APIs (`/api/fortune`)

- POST `/api/fortune` Create a fortune and return prediction
- GET `/api/fortune` List fortunes (latest first)
- PUT `/api/fortune/:idOrSessionKey` Update and re-generate a fortune
- DELETE `/api/fortune/:idOrSessionKey` Delete fortune(s)

Notes:
- `:idOrSessionKey` accepts a Mongo ObjectId or a composite key `name|birthdate|sex|topic` (e.g., `Alice|1995-05-20|female|career`).

#### Example curls

Create chat message
```bash
curl -X POST "http://localhost:3001/api/chat" \
  -H 'Content-Type: application/json' \
  -d '{
    "userInfo": {"name":"Alice","birthdate":"1995-05-20","sex":"female","topic":"career"},
    "message": "ปีนี้งานจะก้าวหน้าไหม?"
  }'
```

Get chat history
```bash
curl "http://localhost:3001/api/chat/history?name=Alice&birthdate=1995-05-20&limit=50"
```

Edit chat message
```bash
curl -X PUT "http://localhost:3001/api/chat/REPLACE_ID" \
  -H 'Content-Type: application/json' \
  -d '{"newMessage":"ถ้าเปลี่ยนงานตอนนี้เหมาะไหม?"}'
```

Create fortune
```bash
curl -X POST "http://localhost:3001/api/fortune" \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Alice",
    "birthdate":"1995-05-20",
    "sex":"female",
    "topic":"career",
    "text":"เลื่อนตำแหน่งมีโอกาสไหม?"
  }'
```

List fortunes
```bash
curl "http://localhost:3001/api/fortune"
```

Update fortune (by id)
```bash
curl -X PUT "http://localhost:3001/api/fortune/REPLACE_ID" \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"Alice",
    "birthdate":"1995-05-20",
    "sex":"female",
    "topic":"career",
    "text":"ขอทำนายใหม่ เพิ่มรายละเอียดการงาน"
  }'
```

Delete fortunes by session key
```bash
curl -X DELETE "http://localhost:3001/api/fortune/Alice|1995-05-20|female|career"
```

## Data models (Mongo)

Collections: `chatmessages`, `fortunes`

`chatmessages`
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

`fortunes`
```json
{
  "name": "string",
  "birthdate": "YYYY-MM-DD",
  "sex": "male|female|other",
  "topic": "overall|career|finance|love|health",
  "text": "string",
  "prediction": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Frontend integration notes

- Base URL: `http://localhost:${PORT}` (default `http://localhost:3001`)
- CORS is enabled broadly (`app.use(cors())`).
- Frontend proxies `/api` to backend by default when running locally.
