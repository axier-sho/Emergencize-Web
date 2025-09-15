#!/bin/bash

echo "🚀 Starting Emergency Alert Socket.io Server..."
echo "📍 Port: 3001"
echo "🔗 URL: http://localhost:3001"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "❌ server.js not found. Please run this script from the project root directory."
    exit 1
fi

# Check if port 3001 is already in use
if lsof -i :3001 > /dev/null 2>&1; then
    echo "⚠️  Port 3001 is already in use. Stopping existing process..."
    kill -9 $(lsof -t -i:3001) 2>/dev/null || true
    sleep 2
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "✅ Starting Socket.io server..."
node server.js