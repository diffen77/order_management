#!/bin/bash

echo "Starting Supabase MCP Server (Node.js version)..."

# Kill any existing Node.js Supabase MCP servers
echo "Checking for existing Supabase MCP server processes..."
ps aux | grep "supabase-mcp-server.js" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true

# Start the server in the background
nohup node supabase-mcp-server.js > supabase-mcp.log 2>&1 &
SERVER_PID=$!

echo "Supabase MCP Server started with PID: $SERVER_PID"
echo "Server logs are being written to: supabase-mcp.log"
echo "To check server status, open: http://localhost:3500/status"
echo "To stop the server, run: kill $SERVER_PID"

# Update the MCP configuration file to point to our server
echo "Updating MCP configuration..."
cat > .cursor/mcp/supabase-mcp-server.json << EOL
{
  "name": "supabase-order-management",
  "description": "MCP server for Supabase cloud database operations",
  "version": "1.0.0",
  "url": "http://localhost:3500",
  "documentationUrl": "https://supabase.com/docs"
}
EOL

echo "MCP configuration updated. The Supabase MCP server should now be operational." 