#!/bin/bash

echo "Stopping all MCP servers for the Order Management project..."

# Stop Supabase MCP server
echo "Stopping Supabase MCP Server..."
ps aux | grep "supabase-mcp-server.js" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
echo "✅ Supabase MCP Server stopped"

# Stop Taskmaster MCP server
echo "Stopping Taskmaster MCP Server..."
ps aux | grep "taskmaster-mcp.js" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
echo "✅ Taskmaster MCP Server stopped"

# Stop Context7 MCP server
echo "Stopping Context7 MCP Server..."
ps aux | grep "context7-mcp" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
echo "✅ Context7 MCP Server stopped"

# Final message
echo ""
echo "All MCP servers have been stopped."
echo "To restart the servers, use: ./start-all-mcps.sh" 