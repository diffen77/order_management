$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$mcpScriptPath = Join-Path $scriptPath "supabase-cloud.ps1"

# Create a function to run the MCP script
function global:supabase-mcp-server {
    param(
        [Parameter(Position=0, ValueFromRemainingArguments=$true)]
        [string[]]$Arguments
    )
    
    & $mcpScriptPath @Arguments
}

Write-Output "Supabase MCP Server registered successfully."
Write-Output "You can now use the 'supabase-mcp-server' command in this PowerShell session."
Write-Output "To make this permanent, add this script to your PowerShell profile." 