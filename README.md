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
├── backend/                      # Express.js API Server
│   ├── server.js                # Main server file with HTTPS requests
│   ├── package.json             # Dependencies (cors, dotenv, express, mongoose)
│   ├── package-lock.json        # Lock file
│   ├── .env                     # Environment variables
│   ├── README.md                # Backend documentation
│   └── node_modules/            # Dependencies
│
├── frontend/                     # Static Web Client
│   ├── app.js                   # Express server for static files
│   ├── index.html               # Main HTML page
│   ├── package.json             # Frontend dependencies (express only)
│   ├── package-lock.json        # Lock file
│   ├── README.md                # Frontend documentation
│   ├── node_modules/            # Dependencies
│   └── public/                  # Static assets
│       ├── styles.css           # CSS styling
│       └── scripts.js           # Vanilla JavaScript
│
├── .vscode/                     # VS Code settings
├── .gitignore                   # Git ignore rules
├── README.md                    # This documentation
└── final-proj3k.zip            # Project archive
```

## Features

- **AI Fortune Teller**: Chat with "อาจารย์คม" using Typhoon AI
- **User Profiles**: Name, birthdate, gender, topic selection
- **Chat History**: MongoDB storage with pagination
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Graceful error recovery
- **Health Monitoring**: API health check endpoint
- **Thai Language**: Full Thai interface and responses
- **Responsive Design**: Desktop and mobile support

## Prerequisites

- **Node.js 18.0.0 or higher** (required)
- **npm 8.0.0 or higher** (required)
- MongoDB (local or cloud)
- Typhoon API key

## Installation

### Quick Setup (Recommended)

```bash
# Run the setup script
./setup.sh

# Or manually:
npm run install:all
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
MONGODB_URI=mongodb://localhost:27017/fortune_telling
TYPHOON_API_KEY=your_api_key_here
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

## API Endpoints

| Method | Endpoint           | Description            |
| ------ | ------------------ | ---------------------- |
| POST   | `/api/chat`        | Chat with AI           |
| POST   | `/api/fortune`     | Create fortune reading |
| GET    | `/api/fortune`     | Get all fortunes       |
| GET    | `/api/fortune/:id` | Get specific fortune   |
| GET    | `/health`          | Health check           |

## Tech Stack

**Backend**

- Node.js
- Express.js
- MongoDB with Mongoose
- Typhoon AI API
- Native HTTPS module (no external HTTP clients)

**Frontend**

- HTML5, CSS3, Vanilla JavaScript
- Express.js for static file serving
- No external JavaScript CDNs (CSS CDNs allowed)

## Dependencies

### Backend Dependencies

- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `express` - Web application framework
- `mongoose` - MongoDB object modeling

### Frontend Dependencies

- `express` - Static file server

## License

MIT License
