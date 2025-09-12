#!/bin/bash

echo "🔮 Thai Fortune Telling App Setup"
echo "================================="

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$node_version" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    echo "Please upgrade Node.js to version 18 or higher."
    exit 1
else
    echo "✅ Node.js version $(node -v) is compatible"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  Development mode: npm run dev"
echo "  Production mode:  npm start"
echo ""
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:3000"
echo ""
echo "Don't forget to:"
echo "1. Set up your MongoDB connection"
echo "2. Add your TYPHOON_API_KEY to backend/.env"