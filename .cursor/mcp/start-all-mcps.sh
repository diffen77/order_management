#!/bin/bash
# Start all MCP servers for this project

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "Starting all MCP servers..."

# Start Supabase MCP server
echo "Starting Supabase MCP Server..."
npx supabase-mcp-server &
SUPABASE_PID=$!
echo "Supabase MCP Server started successfully (PID: $SUPABASE_PID)."

# Start Taskmaster MCP server
echo "Starting Taskmaster MCP Server..."
node "$SCRIPT_DIR/taskmaster-mcp.js" &
TASKMASTER_PID=$!
echo "Taskmaster MCP Server started successfully (PID: $TASKMASTER_PID)."

echo "All MCP servers are now running and available for use in Cursor."
echo "To stop these servers, manually terminate processes with PIDs: $SUPABASE_PID, $TASKMASTER_PID" 