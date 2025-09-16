# Backend - Fortune Chat (Express + Mongo + Typhoon)

## Setup

1. Copy `.env.example` to `.env` and fill values.
2. Install deps and run server.

## Environment variables

- `PORT` (default 3001)
- `MONGO_URI` MongoDB connection string
- `TYPHOON_API_KEY` Typhoon API key
- `TYPHOON_MODEL` (default `typhoon-v2.1-12b-instruct`)

## Scripts

- `npm run dev` - run API smoke tests via curl (auto-starts server if needed)
- `npm start` - start server

## Endpoints

- POST `/api/chat/` Create a new chat message
- GET `/api/chat/history?name=...&birthdate=YYYY-MM-DD` Get history for user
- PUT `/api/chat/:id` Edit a previous user message

## Request/Response

POST `/api/chat`
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

Success response includes saved Mongo document with `assistantResponse`.

## Healthcheck

- GET `/health` → `{ "status": "ok" }`

## Local testing

- Ensure MongoDB is running locally, or set `MONGO_URI` to a remote cluster.
- Put your `TYPHOON_API_KEY` in `.env`.
- Run: `npm run dev` to execute `scripts/test_api.sh` which will:
  - Start the server if not running
  - POST a sample chat, GET history, and PUT an edit

## Frontend integration

- Base URL: `http://localhost:${PORT}` (default `http://localhost:3001`)
- CORS is enabled with default settings.
- Example requests:

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
