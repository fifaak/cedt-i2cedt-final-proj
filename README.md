```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🔮 Thai Fortune Telling App 🔮                           ║
║                          Group 7 Project                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**AI-powered Thai fortune telling web application with separate backend and frontend.**

```
    ⭐ Team Members ⭐
    ┌─────────────────────────────────────────┐
    │ 6833211521  Pattaradanai Akkharat      │
    │ 6833285021  Apiwich Navakun            │
    │ 6833250021  Saranyaphong Toeiphutsa    │
    │ 6833072621  Naphat Sornwichai          │
    │ 6833127521  Theanrawich Thungpromsri   │
    │ 6833293021  Itthipat Wongnopaawich     │
    └─────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Backend (API Server)
```bash
cd backend
npm install
npm run dev  # 🌐 http://localhost:3001
```

### Frontend (Web Client)  
```bash
cd frontend
npm install
npm run dev  # 🌐 http://localhost:3000
```

## 📁 Project Structure

```
thai-fortune-app/
├── 📂 backend/                    # Express.js API Server
│   ├── 🚀 server.js              # Main server file with HTTPS requests
│   ├── 📦 package.json           # Dependencies (cors, dotenv, express, mongoose)
│   ├── 📋 package-lock.json      # Lock file
│   ├── 🔒 .env                   # Environment variables
│   ├── 📖 README.md              # Backend documentation
│   └── 📁 node_modules/          # Dependencies
│
├── 📂 frontend/                   # Static Web Client
│   ├── 🎯 app.js                 # Express server for static files
│   ├── 🌐 index.html             # Main HTML page
│   ├── 📦 package.json           # Frontend dependencies (express only)
│   ├── 📋 package-lock.json      # Lock file
│   ├── 📖 README.md              # Frontend documentation
│   ├── 📁 node_modules/          # Dependencies
│   └── 📁 public/                # Static assets
│       ├── 🎨 styles.css         # CSS styling
│       └── ⚡ scripts.js         # Vanilla JavaScript
│
├── 🔧 .vscode/                   # VS Code settings
├── 🚫 .gitignore                 # Git ignore rules
├── 📚 README.md                  # This documentation
└── 📦 final-proj3k.zip          # Project archive
```

## ✨ Features

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 AI Fortune Teller    │  Chat with "อาจารย์คม"          │
│  👤 User Profiles        │  Name, birthdate, gender, topic │
│  💾 Chat History         │  MongoDB storage & pagination   │
│  ✅ Input Validation     │  Comprehensive data validation  │
│  🛡️  Error Handling      │  Graceful error recovery        │
│  🏥 Health Monitoring    │  API health check endpoint      │
│  🇹🇭 Thai Language       │  Full Thai interface            │
│  📱 Responsive Design    │  Desktop & mobile support       │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

```
    Backend Stack               Frontend Stack
    ┌─────────────────┐        ┌─────────────────┐
    │ 🟢 Node.js      │        │ 🌐 HTML5        │
    │ ⚡ Express.js   │        │ 🎨 CSS3         │
    │ 🍃 MongoDB      │        │ ⚡ Vanilla JS   │
    │ 🌪️  Typhoon AI  │        │ 📦 No CDN JS    │
    │ 🔗 HTTPS Module │        │ ✅ CSS CDN OK   │
    └─────────────────┘        └─────────────────┘
```

## 📋 Prerequisites

```
┌─────────────────────────────────────┐
│ ✅ Node.js (v16+)                  │
│ ✅ MongoDB Database                 │
│ ✅ Typhoon API Key                  │
└─────────────────────────────────────┘
```

## ⚙️ Setup Instructions

### 1️⃣ Backend Setup
```bash
cd backend
npm install  # Installs: cors, dotenv, express, mongoose
```

### 2️⃣ Environment Configuration
Create `.env` file in backend directory:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/fortune_telling
TYPHOON_API_KEY=your_api_key_here
```

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install  # Installs: express (for static serving)
```

### 4️⃣ Launch Application
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev

# 🌐 Visit: http://localhost:3000
```

## 🔌 API Endpoints

```
┌─────────────────────────────────────────────────────────────┐
│ Method │ Endpoint           │ Description                    │
├────────┼────────────────────┼────────────────────────────────┤
│ POST   │ /api/chat          │ 💬 Chat with AI               │
│ POST   │ /api/fortune       │ 🔮 Create fortune reading     │
│ GET    │ /api/fortune       │ 📋 Get all fortunes           │
│ GET    │ /api/fortune/:id   │ 🎯 Get specific fortune       │
│ GET    │ /health            │ 🏥 Health check               │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Dependencies Compliance

### ✅ Backend (Allowed Only)
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `express` - Web framework  
- `mongoose` - MongoDB ODM

### ✅ Frontend (CDN Rules)
- ✅ CSS CDN allowed (Bootstrap, Tailwind, etc.)
- ❌ JavaScript CDN forbidden (except Phaser for class use)
- ✅ Local files only: `/styles.css`, `/scripts.js`

## 📄 License

```
╔════════════════════════════════════╗
║            MIT License             ║
║     Open Source & Educational      ║
╚════════════════════════════════════╝
```