#!/bin/bash

echo "Starting Simple Supabase MCP Server..."

# Make sure backend/.env exists
if [ ! -d backend ]; then
  mkdir -p backend
fi

if [ ! -f backend/.env ]; then
  echo "Creating sample backend/.env file..."
  cat > backend/.env << EOL
# Supabase Configuration
SUPABASE_URL=https://example.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
EOL
  echo "Created sample backend/.env file."
fi

# Basic check if PowerShell is available
if command -v powershell &> /dev/null; then
  echo "PowerShell found, attempting to start Supabase MCP server..."
  powershell -ExecutionPolicy Bypass -File ".cursor/mcp/supabase-cloud.ps1" &
  echo "Supabase MCP Server launched."
else
  echo "PowerShell not found. Cannot start Supabase MCP server."
  exit 1
fi 