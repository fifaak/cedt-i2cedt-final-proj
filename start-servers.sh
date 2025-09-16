#!/bin/bash

echo "🚀 Starting Thai Fortune App servers..."

# Kill any existing processes on ports 3000 and 3001
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to clean up
sleep 2

# Start backend server in background
echo "🔮 Starting backend server on port 3001..."
cd backend && PORT=3001 npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server in background
echo "🌐 Starting frontend server on port 3000..."
cd ../frontend && PORT=3000 npm start &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 2

echo "✅ Both servers started!"
echo "🔮 Backend API: http://localhost:3001/api"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for background processes
wait