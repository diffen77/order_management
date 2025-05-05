$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$mcpScriptPath = Join-Path $scriptPath "taskmaster-mcp.js"

# Start the Taskmaster MCP server
$process = Start-Process -FilePath "node" -ArgumentList @($mcpScriptPath) -NoNewWindow -PassThru
 
Write-Output "Taskmaster MCP Server started successfully (PID: $($process.Id))."
Write-Output "MCP tools are now available for use in Cursor." 