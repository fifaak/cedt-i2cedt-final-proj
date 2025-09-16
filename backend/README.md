# Backend API

Express.js API server for Thai Fortune Telling app with hybrid storage (local + MongoDB sync).

## Setup

```bash
npm install
npm run dev
```

## Environment (.env)

```
PORT=3001
TYPHOON_API_KEY=your_typhoon_api_key_here
MONGODB_URI=mongodb://localhost:27017/fortune_telling  # Optional
```

## Hybrid Storage System

### Local Storage (Primary)
Data is always stored locally in JSON files:
- `storage/data/fortunes.json` - Fortune readings
- `storage/data/chats.json` - Chat sessions

### MongoDB Sync (Secondary)
- **Auto-sync**: Checks MongoDB every 60 seconds
- **Background sync**: Pushes local data to MongoDB when available
- **No dependency**: App works perfectly without MongoDB
- **Manual sync**: `POST /api/sync` for immediate sync

### Sync Status
- `GET /api/sync/status` - Check sync status
- `GET /api/health` - Overall system health including sync status

## API Endpoints

### Fortune Management
- `POST /api/fortune` - Create fortune reading
- `GET /api/fortune` - Get all fortunes (paginated)
- `GET /api/fortune/:id` - Get specific fortune
- `PUT /api/fortune/:id` - Update fortune
- `DELETE /api/fortune/:id` - Delete fortune

### Chat System
- `POST /api/chat` - Chat with AI (no storage)
- `POST /api/chat/` - Create chat session
- `GET /api/chat/user/:userId` - Get user chats
- `GET /api/chat/:chatId` - Get specific chat
- `POST /api/chat/:chatId/messages` - Add message
- `PUT /api/chat/:chatId/messages/:index` - Edit message
- `DELETE /api/chat/:chatId` - Delete chat

### System
- `GET /api/health` - System health
- `POST /api/sync` - Manual sync
- `GET /api/sync/status` - Sync status
