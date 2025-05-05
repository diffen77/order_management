# Order Management MCP Servers

This repository includes several Model Context Protocol (MCP) servers to facilitate integration with AI assistants and development tools like Cursor.

## Available MCP Servers

1. **Supabase MCP Server**: Provides database operations through a local Node.js server
2. **Taskmaster MCP Server**: Manages project tasks and dependencies
3. **Context7 MCP Server**: Provides documentation and code reference capabilities

## Starting the MCP Servers

To start all the MCP servers at once, simply run:

```bash
./start-all-mcps.sh
```

This script will:
- Start the Supabase MCP server on port 3500
- Start the Taskmaster MCP server
- Start the Context7 MCP server

All servers will run in the background, with logs written to:
- `supabase-mcp.log`
- `taskmaster-mcp.log`
- `context7-mcp.log`

## Stopping the MCP Servers

To stop all MCP servers, run:

```bash
./stop-all-mcps.sh
```

## Using Individual Servers

You can also start each server individually:

### Supabase MCP Server

```bash
./start-supabase-node.sh
```

The Supabase MCP server provides these endpoints:
- `GET /status`: Check connection status
- `GET /list_tables`: List all database tables 
- `POST /query`: Execute a read-only SQL query (provide `sql` in the request body)
- `POST /execute`: Execute a SQL command that modifies data (provide `sql` in the request body)

Example:
```bash
curl http://localhost:3500/status
curl http://localhost:3500/list_tables
```

### Configuration

The Supabase MCP server looks for configuration in `backend/.env`:

```
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
```

If these values are not provided, the server runs in mock mode with sample data.

## Troubleshooting

If you encounter issues:

1. Check if the servers are running:
   ```bash
   ps aux | grep mcp
   ```

2. Check the log files for error messages:
   ```bash
   cat supabase-mcp.log
   cat taskmaster-mcp.log
   cat context7-mcp.log
   ```

3. Try restarting all servers:
   ```bash
   ./stop-all-mcps.sh && ./start-all-mcps.sh
   ```

4. Verify the Supabase server is responding:
   ```bash
   curl http://localhost:3500/status
   ```

## Notes

- All MCP servers need to be running for Cursor AI to work optimally with the codebase
- The Supabase MCP server runs in mock mode by default unless you add credentials to `backend/.env` 