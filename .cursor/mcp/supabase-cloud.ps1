param(
    [Parameter(Position=0)]
    [string]$command,
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$arguments
)

$ErrorActionPreference = "Stop"

# Add System.Web for URL encoding
Add-Type -AssemblyName System.Web

function Write-MCP-Response($response) {
    Write-Output "MCP-RESPONSE:$response"
}

# Check if arguments are provided
if ($command -eq $null -or $command -eq "") {
    Write-Output "Connected to Supabase Cloud MCP Server"
    Write-Output "Available commands: query, execute, status, list_tables"
    exit 0
}

# Function to read .env file and extract variables
function Get-EnvFile {
    param(
        [string]$envFilePath
    )

    $envVars = @{}
    
    if (Test-Path $envFilePath) {
        Get-Content $envFilePath | ForEach-Object {
            $line = $_.Trim()
            if ($line -and !$line.StartsWith('#')) {
                $key, $value = $line -split '=', 2
                if ($key -and $value) {
                    $envVars[$key.Trim()] = $value.Trim()
                }
            }
        }
        Write-Output "Successfully loaded .env file from: $envFilePath"
    }
    else {
        Write-Output "Warning: .env file not found at: $envFilePath"
    }
    
    return $envVars
}

# Find the correct path to the workspace root
$scriptDir = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $scriptDir

Write-Output "Looking for .env file in directory: $workspaceRoot\backend"

# Path to the backend .env file
$envFilePath = Join-Path $workspaceRoot "backend\.env"

# Try to read from .env file
$envVars = Get-EnvFile -envFilePath $envFilePath

# Set Supabase project URL and key from .env file or environment variables
$SUPABASE_URL = if ($envVars.SUPABASE_URL) { $envVars.SUPABASE_URL } else { $env:SUPABASE_URL }
$SUPABASE_KEY = if ($envVars.SUPABASE_SERVICE_KEY) { $envVars.SUPABASE_SERVICE_KEY } else { $env:SUPABASE_KEY }

# For demonstration, use mock data if credentials aren't set
$useMockData = [string]::IsNullOrEmpty($SUPABASE_URL) -or [string]::IsNullOrEmpty($SUPABASE_KEY) -or $SUPABASE_URL -eq "https://example.supabase.co" -or $SUPABASE_URL -eq "https://your-project-id.supabase.co"

if ($useMockData) {
    if (!(Test-Path $envFilePath)) {
        Write-Output "Warning: backend/.env file not found. Using mock data."
    }
    else {
        Write-Output "Valid Supabase credentials not found in backend/.env. Using mock data."
        Write-Output "Please update backend/.env with real Supabase credentials."
    }
    
    $MOCK_TABLES = @(
        "orders",
        "customers",
        "products",
        "order_items",
        "inventory",
        "suppliers"
    )
}
elseif ([string]::IsNullOrEmpty($SUPABASE_URL) -or [string]::IsNullOrEmpty($SUPABASE_KEY)) {
    Write-Output "Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env file"
    exit 1
}

function Invoke-SupabaseAPI {
    param (
        [string]$Endpoint,
        [string]$Method = "GET",
        [string]$Body
    )

    if ($useMockData) {
        # Return mock data based on the endpoint
        if ($Endpoint -eq "rest/v1/?apikey=$SUPABASE_KEY") {
            $mockResponse = @{}
            foreach ($table in $MOCK_TABLES) {
                $mockResponse[$table] = @()
            }
            return $mockResponse
        }
        elseif ($Endpoint -eq "rest/v1/rpc/list_tables") {
            return $MOCK_TABLES
        }
        elseif ($Endpoint -match "rest/v1/(\w+)") {
            $tableName = $matches[1]
            if ($MOCK_TABLES -contains $tableName) {
                return @(
                    @{ id = 1; name = "Sample 1"; created_at = (Get-Date).ToString("o") },
                    @{ id = 2; name = "Sample 2"; created_at = (Get-Date).ToString("o") }
                )
            }
            else {
                throw "Table not found: $tableName"
            }
        }
        return $null
    }

    $headers = @{
        "apikey" = $SUPABASE_KEY
        "Authorization" = "Bearer $SUPABASE_KEY"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    }

    $params = @{
        Uri = "$SUPABASE_URL/$Endpoint"
        Method = $Method
        Headers = $headers
    }

    if ($Method -in "POST", "PATCH", "PUT" -and $Body) {
        $params.Body = $Body
    }

    try {
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Output "Error calling Supabase API: $_"
        Write-Output "StatusCode: $($_.Exception.Response.StatusCode.value__)"
        Write-Output "StatusDescription: $($_.Exception.Response.StatusDescription)"
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Output "Response body: $responseBody"
            $reader.Close()
        }
        
        exit 1
    }
}

switch ($command) {
    "status" {
        try {
            if ($useMockData) {
                Write-Output "Supabase Cloud Connection Status (MOCK MODE)"
                Write-Output "URL: https://example.supabase.co (mock)"
                Write-Output "Connected: Yes (mock connection)"
            }
            else {
                $response = Invoke-SupabaseAPI -Endpoint "rest/v1/?apikey=$SUPABASE_KEY"
                Write-Output "Supabase Cloud Connection Status"
                Write-Output "URL: $SUPABASE_URL"
                Write-Output "Connected: Yes"
            }
            exit 0
        }
        catch {
            Write-Output "Supabase Cloud Connection Status"
            Write-Output "URL: $SUPABASE_URL"
            Write-Output "Connected: No (Error: $_)"
            exit 1
        }
    }
    "list_tables" {
        # This query gets the list of tables from the Supabase PostgreSQL information_schema
        $query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        $encodedQuery = [System.Web.HttpUtility]::UrlEncode($query)
        
        try {
            if ($useMockData) {
                Write-Output "Tables in Supabase database (MOCK MODE):"
                foreach ($table in $MOCK_TABLES) {
                    Write-Output "- $table"
                }
                Write-MCP-Response ($MOCK_TABLES | ConvertTo-Json -Compress)
                exit 0
            }

            $response = Invoke-SupabaseAPI -Endpoint "rest/v1/rpc/list_tables"
            Write-Output "Tables in Supabase database:"
            $response | ForEach-Object {
                Write-Output "- $_"
            }
            Write-MCP-Response ($response | ConvertTo-Json -Compress)
            exit 0
        }
        catch {
            # Fallback to a more direct query
            try {
                $response = Invoke-SupabaseAPI -Endpoint "rest/v1/?apikey=$SUPABASE_KEY"
                Write-Output "Tables in Supabase database:"
                $tables = @()
                foreach ($key in $response.PSObject.Properties.Name) {
                    Write-Output "- $key"
                    $tables += $key
                }
                Write-MCP-Response ($tables | ConvertTo-Json -Compress)
                exit 0
            }
            catch {
                Write-Output "Error getting tables: $_"
                Write-MCP-Response '{"error": "Failed to retrieve tables"}'
                exit 1
            }
        }
    }
    "query" {
        # Format: query "SELECT * FROM your_table"
        if ($arguments.Count -lt 1) {
            Write-Output "Error: Missing SQL query"
            exit 1
        }
        
        $sql = $arguments[0]
        $encodedQuery = [System.Web.HttpUtility]::UrlEncode($sql)
        
        try {
            if ($sql -match "SELECT.*FROM\s+(\w+)") {
                $tableName = $matches[1]
                
                if ($useMockData) {
                    Write-Output "Query results (MOCK MODE):"
                    $mockData = @(
                        @{ id = 1; name = "Sample 1"; created_at = (Get-Date).ToString("o") },
                        @{ id = 2; name = "Sample 2"; created_at = (Get-Date).ToString("o") }
                    )
                    $mockData | ConvertTo-Json
                    Write-MCP-Response ($mockData | ConvertTo-Json -Compress)
                    exit 0
                }
                
                $response = Invoke-SupabaseAPI -Endpoint "rest/v1/$tableName"
                Write-Output "Query results:"
                $response | ConvertTo-Json
                Write-MCP-Response ($response | ConvertTo-Json -Compress)
            }
            else {
                Write-Output "Only simple SELECT queries are supported"
                Write-MCP-Response '{"error": "Only simple SELECT queries are supported"}'
            }
            exit 0
        }
        catch {
            Write-Output "Error executing query: $_"
            Write-MCP-Response '{"error": "Failed to execute query"}'
            exit 1
        }
    }
    "execute" {
        # Format: execute "CREATE TABLE example (id SERIAL PRIMARY KEY)"
        if ($arguments.Count -lt 1) {
            Write-Output "Error: Missing SQL statement"
            exit 1
        }
        
        $sql = $arguments[0]
        
        if ($useMockData) {
            Write-Output "Execute SQL (MOCK MODE):"
            Write-Output "SQL would be executed on the Supabase database"
            Write-MCP-Response '{"success": true, "mock": true}'
            exit 0
        }
        
        # We'd need to use the pg_dump SQL API or another method for arbitrary SQL
        Write-Output "Execute SQL is not implemented for direct REST API usage"
        Write-Output "Use the Supabase dashboard SQL editor for complex operations"
        
        Write-MCP-Response '{"warning": "Execute SQL is not fully implemented for REST API"}'
        exit 0
    }
    default {
        Write-Output "Unknown command: $command"
        Write-Output "Available commands: query, execute, status, list_tables"
        exit 1
    }
} 