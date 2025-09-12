#!/bin/bash

echo "🍃 MongoDB Setup Helper"
echo "======================"

# Check if MongoDB is installed locally
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB is installed locally"
    
    # Check if MongoDB is running
    if pgrep mongod > /dev/null; then
        echo "✅ MongoDB is already running"
    else
        echo "🔄 Starting MongoDB..."
        # Try to start MongoDB (macOS with Homebrew)
        if command -v brew &> /dev/null; then
            brew services start mongodb-community
        else
            echo "Please start MongoDB manually: mongod"
        fi
    fi
    
    echo "📝 Update your .env file to use local MongoDB:"
    echo 'MONGODB_URI="mongodb://localhost:27017/fortune_telling"'
    
elif command -v docker &> /dev/null; then
    echo "🐳 MongoDB not found locally, but Docker is available"
    echo "Would you like to run MongoDB in Docker? (y/n)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "🔄 Starting MongoDB container..."
        docker run -d \
            --name mongodb-fortune \
            -p 27017:27017 \
            -e MONGO_INITDB_DATABASE=fortune_telling \
            mongo:latest
        
        echo "✅ MongoDB container started"
        echo "📝 Update your .env file to use Docker MongoDB:"
        echo 'MONGODB_URI="mongodb://localhost:27017/fortune_telling"'
    fi
    
else
    echo "❌ Neither MongoDB nor Docker found"
    echo ""
    echo "Options to fix this:"
    echo "1. Install MongoDB locally:"
    echo "   macOS: brew install mongodb-community"
    echo "   Ubuntu: sudo apt install mongodb"
    echo ""
    echo "2. Install Docker and run MongoDB container"
    echo ""
    echo "3. Use MongoDB Atlas (cloud):"
    echo "   - Go to https://cloud.mongodb.com"
    echo "   - Create a free cluster"
    echo "   - Get connection string"
    echo "   - Update MONGODB_URI in .env"
    echo ""
    echo "4. Fix your current Atlas connection:"
    echo "   - Check if cluster is active"
    echo "   - Verify IP whitelist (add 0.0.0.0/0 for testing)"
    echo "   - Test connection string"
fi