#!/bin/bash

echo "Starting Supabase MCP Server..."

# Kill any existing supabase MCP servers
echo "Checking for existing Supabase MCP server processes..."
ps aux | grep supabase-mcp | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true

# Check if .env file exists in backend directory
if [ ! -f "backend/.env" ]; then
    echo "Warning: backend/.env file not found. Creating a sample .env file."
    mkdir -p backend
    cat > backend/.env << EOL
# Supabase Configuration
SUPABASE_URL=https://example.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
EOL
    echo "Created sample backend/.env file. Please update with your actual Supabase credentials."
fi

# Try different approaches to start the Supabase MCP server
echo "Attempting to start Supabase MCP server..."

# Approach 1: Try using npx to run the PowerShell script directly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # For macOS
    echo "Running on macOS, using direct PowerShell script approach..."
    # Start in the background and redirect output to a log file
    nohup bash -c "cd \"$(pwd)\" && powershell -ExecutionPolicy Bypass -File \".cursor/mcp/supabase-cloud.ps1\"" > supabase-mcp.log 2>&1 &
    echo "Server started in background mode. Check supabase-mcp.log for output."
    echo "Process ID: $!"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # For Linux
    echo "Running on Linux, trying pwsh if available..."
    if command -v pwsh &> /dev/null; then
        nohup pwsh -ExecutionPolicy Bypass -File ".cursor/mcp/supabase-cloud.ps1" > supabase-mcp.log 2>&1 &
        echo "Server started in background mode. Check supabase-mcp.log for output."
        echo "Process ID: $!"
    else
        echo "PowerShell not found on Linux. Cannot start server via PowerShell script."
    fi
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # For Windows
    echo "Running on Windows, using PowerShell directly..."
    start powershell -ExecutionPolicy Bypass -File ".cursor/mcp/supabase-cloud.ps1"
    echo "Server started in a new PowerShell window."
else
    echo "Unsupported operating system: $OSTYPE"
fi

# Approach 2: As a fallback, try the @smithery/cli
echo "Also trying @smithery/cli as a fallback method..."
nohup npx -y @smithery/cli@latest start @Anthony9906/supabase-mcp-server --client cursor --profile royal-bass-AGAqzo > smithery-mcp.log 2>&1 &
echo "Smithery CLI started in background mode. Check smithery-mcp.log for output."
echo "Process ID: $!"

echo "Supabase MCP Server startup attempts completed."
echo "To verify if the server is running, use: ps aux | grep supabase" 