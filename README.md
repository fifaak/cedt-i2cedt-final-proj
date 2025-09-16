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
npm run dev  # http://localhost:3001
```

### Frontend (Web Client)

```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

## Project Structure

```
thai-fortune-app/
├── backend/                     # Express.js API Server
│   ├── controllers/             # Route controllers
│   ├── routes/                  # API routes
│   ├── services/                # Business logic (MongoDB sync)
│   ├── storage/                 # Local storage implementation
│   │   ├── localStorage.js      # Local JSON file storage
│   │   └── data/                # JSON data files
│   ├── server.js                # Main server file
│   ├── package.json             # Dependencies
│   └── .env                     # Environment variables
│
├── frontend/                    # Static Web Client
│   ├── public/                  # Static assets
│   │   ├── index.html           # Main HTML page
│   │   ├── styles.css           # CSS styling
│   │   └── scripts.js           # Vanilla JavaScript
│   ├── server.js                # Express server for static files
│   └── package.json             # Frontend dependencies
│
├── .vscode/                     # VS Code settings
├── .gitignore                   # Git ignore rules
├── package.json                 # Root package.json for scripts
├── setup.sh                     # Setup script
├── start-servers.sh             # Start both servers
├── test-connection.js           # Connection test script
└── README.md                    # This documentation
```

## Features

### 🔮 **Core Features**

- **AI Fortune Teller**: Chat with "อาจารย์คม" using Typhoon AI
- **User Profiles**: Name, birthdate, gender, topic selection
- **Chat History**: Hybrid storage (local files + MongoDB sync) with pagination
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Graceful error recovery

### 🎨 **UI/UX Features**

- **Typing Animation**: Realistic typing effect for AI responses with variable speed
- **Typing Indicator**: Animated "อาจารย์คมกำลังเพ่งดวง..." while waiting for response
- **Improved Text Input**: Taller textarea (3 rows) with auto-resize
- **Better Message Actions**: Edit/resend buttons with icons, positioned below messages
- **Smooth Animations**: Fade-in effects and pulse animations for better UX
- **Responsive Design**: Desktop and mobile support
- **Thai Language**: Full Thai interface and responses
- **Dark Theme**: Modern dark theme with gold accents

### 🔧 **Technical Features**

- **Hybrid Storage**: Local-first with MongoDB sync
- **Auto-Sync**: Background sync every 10 seconds
- **Health Monitoring**: API health check and sync status endpoints
- **Offline-First**: Works perfectly without database connection
- **Real-time Updates**: Live sync status and connection monitoring

## Prerequisites

- **Node.js 18.0.0 or higher** (required)
- **npm 8.0.0 or higher** (required)
- Typhoon API key (for AI predictions)
- MongoDB (optional - app works without it, syncs when available)

## Installation

### Quick Setup (Recommended)

```bash
# Run the setup script
./setup.sh

# Or manually:
npm run install:all

# Start both servers
./start-servers.sh
```

### Manual Setup

#### 1. Check Node.js Version

```bash
node --version  # Should be 18.0.0 or higher
```

#### 2. Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or install individually:
npm install                    # Root dependencies
npm install --prefix backend   # Backend dependencies
npm install --prefix frontend  # Frontend dependencies
```

#### 3. Environment Configuration

Create `.env` file in backend directory:

```env
PORT=3001
TYPHOON_API_KEY=your_api_key_here
MONGODB_URI=mongodb://localhost:27017/fortune_telling  # Optional
```

#### 4. Launch Application

```bash
# Development mode (both servers)
npm run dev

# Or run individually:
npm run dev:backend   # Backend only (port 3001)
npm run dev:frontend  # Frontend only (port 3000)

# Production mode
npm start

# Visit: http://localhost:3000
```

## Hybrid Storage System

The app uses a **hybrid storage approach** that provides the best of both worlds:

### 🔄 **How it Works**

- **Primary Storage**: Local JSON files (always available)
- **Secondary Storage**: MongoDB (syncs when available)
- **Auto-Sync**: Checks MongoDB every 60 seconds and syncs local data
- **Offline-First**: App works perfectly without MongoDB

### 📁 **Data Flow**

1. All data is **immediately saved locally** (instant response)
2. Background service **checks MongoDB availability** every 60 seconds
3. When MongoDB is available, **local data syncs automatically**
4. **No data loss** - local files persist even if MongoDB is down

## API Endpoints

### Fortune Telling

| Method | Endpoint           | Description                  | Request Body                          |
| ------ | ------------------ | ---------------------------- | ------------------------------------- |
| POST   | `/api/fortune`     | Create fortune reading       | `{name, birthdate, sex, topic, text}` |
| GET    | `/api/fortune`     | Get all fortunes (paginated) | Query: `?limit=50&page=1`             |
| GET    | `/api/fortune/:id` | Get specific fortune         | -                                     |
| PUT    | `/api/fortune/:id` | Update fortune               | `{name, birthdate, sex, topic, text}` |
| DELETE | `/api/fortune/:id` | Delete fortune               | -                                     |

### Chat

| Method | Endpoint                            | Description               | Request Body          |
| ------ | ----------------------------------- | ------------------------- | --------------------- |
| POST   | `/api/chat`                         | Chat with AI (no storage) | `{message, userInfo}` |
| POST   | `/api/chat/`                        | Create new chat session   | `{userId, message}`   |
| GET    | `/api/chat/user/:userId`            | Get user's chat history   | -                     |
| GET    | `/api/chat/:chatId`                 | Get specific chat         | -                     |
| POST   | `/api/chat/:chatId/messages`        | Add message to chat       | `{content, role}`     |
| PUT    | `/api/chat/:chatId/messages/:index` | Edit message              | `{content}`           |
| DELETE | `/api/chat/:chatId`                 | Delete chat               | -                     |
| DELETE | `/api/chat/:chatId/messages/:index` | Delete message            | -                     |

### System

| Method | Endpoint           | Description         | Response                                |
| ------ | ------------------ | ------------------- | --------------------------------------- |
| GET    | `/api/health`      | System health check | `{status, storage, sync, nodeVersion}`  |
| POST   | `/api/sync`        | Manual MongoDB sync | `{success, message, details}`           |
| GET    | `/api/sync/status` | Check sync status   | `{isConnected, syncActive, mongoState}` |

## Tech Stack

**Backend**

- Node.js
- Express.js
- Hybrid storage (Local JSON files + MongoDB sync)
- Typhoon AI API
- Native HTTPS module (no external HTTP clients)

**Frontend**

- HTML5, CSS3, Vanilla JavaScript
- Express.js for static file serving
- No external JavaScript CDNs (CSS CDNs allowed)

## Dependencies

### Backend Dependencies (Compliant)

- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `express` - Web application framework (only allowed backend framework)
- `mongoose` - MongoDB object modeling (for sync)

### Frontend Dependencies (Compliant)

- `express` - Static file server only
- **CDN Usage**: Google Fonts CSS only (stylesheets allowed, scripts prohibited)

## Compliance

### ✅ **Requirements Met**

- **Backend Framework**: Express.js only (no other frameworks)
- **Dependencies**: Only allowed packages (cors, dotenv, express, mongoose)
- **CDN Usage**: Google Fonts CSS only (no script CDNs)
- **MongoDB**: Atlas cloud connection with 60-second sync interval
- **Local Storage**: Primary storage with MongoDB as secondary sync

### 📋 **Dependency Verification**

```bash
# Quick verification of all requirements
./verify-setup.sh

# Manual dependency check
cd backend && npm list --depth=0
cd ../frontend && npm list --depth=0
```

## License

MIT License
