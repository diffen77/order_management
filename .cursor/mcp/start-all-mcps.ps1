# Start all MCP servers for this project
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Output "Starting all MCP servers..."

# Start Supabase MCP server
$supabaseMcpScript = Join-Path $scriptPath "supabase-cloud.ps1"
$supabaseProcess = Start-Process -FilePath "pwsh" -ArgumentList @("-File", $supabaseMcpScript) -NoNewWindow -PassThru

Write-Output "Supabase MCP Server started successfully (PID: $($supabaseProcess.Id))."

# Start Taskmaster MCP server
$taskmasterMcpScript = Join-Path $scriptPath "taskmaster-mcp.js"
$taskmasterProcess = Start-Process -FilePath "node" -ArgumentList @($taskmasterMcpScript) -NoNewWindow -PassThru

Write-Output "Taskmaster MCP Server started successfully (PID: $($taskmasterProcess.Id))."

Write-Output "All MCP servers are now running and available for use in Cursor."
Write-Output "To stop these servers, manually terminate processes with PIDs: $($supabaseProcess.Id), $($taskmasterProcess.Id)" 