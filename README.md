# Thai Fortune Telling App

AI-powered Thai fortune telling web application with separate backend and frontend.

## Team Members

- 6833211521 Pattaradanai Akkharat
- 6833285021 Apiwich Navakun
- 6833250021 Saranyaphong Toeiphutsa
- 6833072621 Naphat Sornwichai
- 6833127521 Theanrawich Thungpromsri
- 6833293021 Itthipat Wongnopaawich

## Quick Start

### Backend (API Server)

```bash
cd backend
npm install
npm start  # http://localhost:3001
```

### Frontend (Web Client)

```bash
cd frontend
npm install
npm start  # http://localhost:3000
```

Alternative (dev reload):

```bash
# Backend smoke tests + auto-start
cd backend && npm run dev

# Frontend with nodemon
cd frontend && npm run dev
```

## Project Structure

```
cedt-i2cedt-final-proj/
├── backend/                     # Express.js API Server (Mongo + Typhoon)
│   ├── config/                  # DB connection
│   ├── controllers/             # Chat & Fortune controllers
│   ├── models/                  # Mongoose models
│   ├── routes/                  # /api/chat, /api/fortune
│   ├── services/                # Typhoon client
│   ├── scripts/                 # test_api.sh
│   └── server.js                # App entry
│
├── frontend/                    # Static Web Client
│   ├── public/                  # index.html, styles.css
│   ├── src/                     # JS modules
│   └── server.js                # Static + /api proxy
│
├── start-servers.sh             # Helper script to start both
├── setup.sh                     # Helper setup script
├── test-connection.js           # Connectivity test
└── README.md                    # This documentation
```

## Features Overview

- **AI Fortune Teller** using Typhoon API
- **Chat History** stored in MongoDB
- **Fortune CRUD** endpoints with prediction generation
- **Typing animations** and modern UI (frontend)

## Requirements

- Node.js >= 18
- Typhoon API key (`TYPHOON_API_KEY`)
- MongoDB (local or Atlas)

## Environment

Backend `.env` example:

```env
PORT=3001
TYPHOON_API_KEY=your_api_key_here
MONGO_URI=mongodb://127.0.0.1:27017/fortune_chat
```

Frontend `.env` example:

```env
PORT=3000
BACKEND_HOST=localhost
BACKEND_PORT=3001
# API_BASE=http://localhost:3001/api
```

## Useful Scripts

From repo root:

```bash
# Install all deps
npm install --prefix backend && npm install --prefix frontend

# Start both (two terminals)
(cd backend && npm start) & (cd frontend && npm start)
```

Or use helpers:

```bash
./setup.sh
./start-servers.sh
```

## Documentation

- Backend details: `backend/README.md`
- Frontend details: `frontend/README.md`
- Data contracts: `frontend/DATA_SCHEMA.md`

## License

MIT License
