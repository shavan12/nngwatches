#!/bin/bash
echo "🚀 Starting NNG Luxury Timepieces..."

# Start backend
echo "[1/2] Starting backend on port 4000..."
cd backend && npm install && npm start &
BACKEND_PID=$!

# Wait for backend
sleep 3

# Start frontend
echo "[2/2] Starting frontend on port 5173..."
cd ../frontend && npm install && npm run dev &
FRONTEND_PID=$!

sleep 4
echo ""
echo "✅ NNG is running!"
echo "   Store:  http://localhost:5173"
echo "   Admin:  http://localhost:5173/admin"
echo "   Login:  admin@nng.com / admin123"
echo ""
echo "Press Ctrl+C to stop both servers"

# Open browser
sleep 2
open http://localhost:5173 2>/dev/null || xdg-open http://localhost:5173 2>/dev/null

wait $BACKEND_PID $FRONTEND_PID
