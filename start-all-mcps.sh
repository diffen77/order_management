#!/bin/bash

echo "Starting all MCP servers for the Order Management project..."

# Start Supabase MCP server (Node.js version)
echo "Starting Supabase MCP Server..."
./start-supabase-node.sh
echo "✅ Supabase MCP Server started"

# Start Taskmaster MCP server
echo "Starting Taskmaster MCP Server..."
SCRIPT_DIR=".cursor/mcp"
if [ -f "$SCRIPT_DIR/taskmaster-mcp.js" ]; then
  nohup node "$SCRIPT_DIR/taskmaster-mcp.js" > taskmaster-mcp.log 2>&1 &
  TASKMASTER_PID=$!
  echo "✅ Taskmaster MCP Server started with PID: $TASKMASTER_PID"
  echo "   Logs are being written to: taskmaster-mcp.log"
else
  echo "❌ Taskmaster MCP Server not found. Skipping."
fi

# Start Context7 MCP server
echo "Starting Context7 MCP Server..."
nohup npx context7-mcp > context7-mcp.log 2>&1 &
CONTEXT7_PID=$!
echo "✅ Context7 MCP Server started with PID: $CONTEXT7_PID"
echo "   Logs are being written to: context7-mcp.log"

# Final message
echo ""
echo "All MCP servers are now running and available for use in Cursor."
echo "To check server status:"
echo "- Supabase MCP: curl http://localhost:3500/status"
echo "- Taskmaster & Context7: ps aux | grep mcp"
echo ""
echo "To stop all MCP servers, use: kill $SUPABASE_PID $TASKMASTER_PID $CONTEXT7_PID" 