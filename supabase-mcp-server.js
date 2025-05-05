#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Set up server port
const PORT = process.env.SUPABASE_MCP_PORT || 3500;

// Try to load .env from backend directory
const envPath = path.join(process.cwd(), 'backend', '.env');
let supabaseConfig = {};

// Ensure backend directory exists
if (!fs.existsSync(path.join(process.cwd(), 'backend'))) {
  fs.mkdirSync(path.join(process.cwd(), 'backend'), { recursive: true });
}

// Check if .env file exists, if not create a sample one
if (!fs.existsSync(envPath)) {
  console.log('Creating sample backend/.env file...');
  const sampleEnv = `# Supabase Configuration
SUPABASE_URL=https://example.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
`;
  fs.writeFileSync(envPath, sampleEnv);
  console.log('Created sample backend/.env file. Please update with your Supabase credentials.');
}

// Load environment variables
try {
  supabaseConfig = dotenv.config({ path: envPath }).parsed || {};
} catch (error) {
  console.warn(`Warning: Could not parse .env file: ${error.message}`);
}

// Get Supabase credentials
const SUPABASE_URL = supabaseConfig.SUPABASE_URL || process.env.SUPABASE_URL || 'https://example.supabase.co';
const SUPABASE_KEY = supabaseConfig.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Check if we should use mock data
const useMockData = !SUPABASE_KEY || SUPABASE_URL === 'https://example.supabase.co';

if (useMockData) {
  console.log('Using mock data mode - no valid Supabase credentials found.');
} else {
  console.log(`Connected to Supabase at: ${SUPABASE_URL}`);
}

// Available RPC functions
let hasPgrestExec = false;
let hasPgrestQuery = false;
let hasCreateDummyTable = false;

// Initialize Supabase client
let supabase = null;
if (!useMockData) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error.message);
    supabase = null;
  }
}

// Mock tables for development
const MOCK_TABLES = [
  'orders',
  'customers', 
  'products',
  'order_items',
  'inventory',
  'suppliers'
];

// Function to check if required RPC functions exist
async function checkRpcFunctions() {
  if (useMockData || !supabase) return;
  
  // Check pgrest_exec
  try {
    const { data, error } = await supabase.rpc('pgrest_exec', { query: 'SELECT 1' });
    if (!error) {
      console.log('✅ pgrest_exec function available');
      hasPgrestExec = true;
    } else {
      console.log('❌ pgrest_exec function not available:', error.message);
    }
  } catch (error) {
    console.log('❌ pgrest_exec function not available:', error.message);
  }
  
  // Check pgrest_query 
  try {
    const { data, error } = await supabase.rpc('pgrest_query', { query: 'SELECT 1' });
    if (!error) {
      console.log('✅ pgrest_query function available');
      hasPgrestQuery = true;
    } else {
      console.log('❌ pgrest_query function not available:', error.message);
    }
  } catch (error) {
    console.log('❌ pgrest_query function not available:', error.message);
  }
  
  // Check create_dummy_table
  try {
    const { data, error } = await supabase.rpc('create_dummy_table');
    if (!error) {
      console.log('✅ create_dummy_table function available');
      hasCreateDummyTable = true;
    } else {
      console.log('❌ create_dummy_table function not available:', error.message);
    }
  } catch (error) {
    console.log('❌ create_dummy_table function not available:', error.message);
  }
  
  if (!hasPgrestExec && !hasPgrestQuery) {
    console.log('⚠️ No SQL execution functions available. This server will operate in limited mode.');
    console.log('⚠️ Please run the SQL migrations to create these functions:');
    console.log('⚠️ supabase/migrations/20240505193011_create_pgrest_exec_function.sql');
  }
}

// Function to execute SQL via Supabase
async function executeSql(sql, isSelect = false) {
  if (useMockData || !supabase) {
    console.log('MOCK SQL:', sql);
    return [{ result: 'Mock SQL result' }];
  }

  console.log(`Executing ${isSelect ? 'SELECT' : 'SQL'}:`, sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
  
  // For SELECT queries, try to use the read-only function first
  if (isSelect && hasPgrestQuery) {
    try {
      const { data, error } = await supabase.rpc('pgrest_query', { query: sql });
      
      if (error) {
        console.error('PostgreSQL Error (pgrest_query):', error);
        throw error;
      }
      
      console.log('Query result:', data ? JSON.stringify(data).substring(0, 100) + '...' : 'No data');
      return data || [];
    } catch (error) {
      console.warn('Failed to execute via pgrest_query, falling back:', error.message);
      // Fall through to next method
    }
  }
  
  // Try pgrest_exec for all SQL
  if (hasPgrestExec) {
    try {
      const { data, error } = await supabase.rpc('pgrest_exec', { query: sql });
      
      if (error) {
        console.error('PostgreSQL Error (pgrest_exec):', error);
        throw error;
      }
      
      console.log('Query result:', data ? JSON.stringify(data).substring(0, 100) + '...' : 'No data');
      return data || [];
    } catch (error) {
      console.warn('Failed to execute via pgrest_exec, falling back:', error.message);
      // Fall through to next method
    }
  }
  
  // If no RPC functions available, fall back to Supabase API
  console.warn('No RPC functions available, falling back to Supabase API');
  
  if (isSelect) {
    // For SELECT queries, we'll try to explain what's expected
    return [{
      notice: 'SQL execution requires RPC functions. Please run the SQL migrations to create these functions.',
      required_file: 'supabase/migrations/20240505193011_create_pgrest_exec_function.sql',
      query_attempted: sql.substring(0, 100) + (sql.length > 100 ? '...' : '')
    }];
  } else {
    // For data modifications, show a clear message
    return [{
      notice: 'Data modification operations require direct database access via Supabase Studio',
      instruction: 'Please run this SQL statement in Supabase Studio SQL Editor',
      sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : '')
    }];
  }
}

// Function to run a migration file 
async function runMigration(migrationFile) {
  if (useMockData) {
    console.log(`MOCK: Would run migration file ${migrationFile}`);
    return { message: 'Mock migration successful' };
  }
  
  console.log(`Attempting to run migration: ${migrationFile}`);
  const sql = fs.readFileSync(migrationFile, 'utf8');
  console.log('Migration SQL:', sql.substring(0, 200) + '...');
  
  // For migrations, we typically have multiple SQL statements
  // Check if the first one is a SELECT query
  const isMostlySelect = sql.trim().toLowerCase().startsWith('select');
  
  try {
    // Try to execute the SQL
    const result = await executeSql(sql, isMostlySelect);
    return { 
      message: 'Migration execution attempted',
      note: !hasPgrestExec ? 'Limited functionality: RPC functions not available' : 'Migration applied via RPC',
      details: result 
    };
  } catch (error) {
    console.error('Migration failed:', error.message);
    
    return { 
      message: 'Migration requires Supabase Studio or CLI', 
      error: error.message,
      instruction: 'Please run this migration manually in Supabase Studio SQL Editor',
      file: migrationFile
    };
  }
}

// Function to create a dummy table for selects
async function createDummyTable() {
  if (useMockData || !supabase) return;
  
  if (hasCreateDummyTable) {
    try {
      const { error } = await supabase.rpc('create_dummy_table');
      if (error) {
        console.warn('Could not create dummy table via RPC:', error.message);
      } else {
        console.log('Created dummy table for queries via RPC');
      }
    } catch (error) {
      console.warn('Error creating dummy table via RPC:', error.message);
    }
  } else {
    console.warn('create_dummy_table function not available');
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Parse URL to get the command
  const url = new URL(req.url, `http://${req.headers.host}`);
  const command = url.pathname.substring(1);
  
  console.log(`Received request: ${req.method} ${req.url}`);
  
  // Process request body if it exists
  let body = '';
  if (req.method === 'POST') {
    await new Promise(resolve => {
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', resolve);
    });
  }
  
  // Parse JSON body if exists
  let requestData = {};
  try {
    if (body) {
      requestData = JSON.parse(body);
      console.log('Request body:', requestData);
    }
  } catch (error) {
    console.error('Error parsing request body:', error.message);
    console.error('Raw body received:', body);
  }
  
  // Set content type for all responses
  res.setHeader('Content-Type', 'application/json');
  
  try {
    let responseData;
    
    // Handle different commands
    switch (command) {
      case 'status':
        responseData = {
          status: 'connected',
          url: SUPABASE_URL,
          mockMode: useMockData,
          capabilities: {
            pgrest_exec: hasPgrestExec,
            pgrest_query: hasPgrestQuery,
            create_dummy_table: hasCreateDummyTable
          }
        };
        break;
        
      case 'list_tables':
        if (useMockData) {
          responseData = MOCK_TABLES;
        } else {
          try {
            const result = await executeSql(`
              SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = 'public'
            `, true);
            
            // If this is a notice about missing functions, return mock tables
            if (result && result[0] && result[0].notice) {
              console.log('Using mock tables due to limited functionality');
              responseData = MOCK_TABLES;
            } else {
              responseData = result.map(row => row.table_name || row.table_name);
            }
          } catch (error) {
            console.warn('Error listing tables, using mock data:', error.message);
            responseData = MOCK_TABLES;
          }
        }
        break;
        
      case 'query':
        if (!requestData.sql) {
          throw new Error('Missing SQL query in request body');
        }
        
        // Determine if it's a SELECT query
        const isSelect = requestData.sql.trim().toLowerCase().startsWith('select');
        responseData = await executeSql(requestData.sql, isSelect);
        break;
        
      case 'execute':
        if (!requestData.sql) {
          throw new Error('Missing SQL query in request body');
        }
        responseData = await executeSql(requestData.sql, false);
        break;
        
      case 'run_migration':
        if (!requestData.file) {
          throw new Error('Missing migration file path in request body');
        }
        const migrationPath = path.resolve(process.cwd(), requestData.file);
        if (!fs.existsSync(migrationPath)) {
          throw new Error(`Migration file not found: ${requestData.file}`);
        }
        responseData = await runMigration(migrationPath);
        break;
        
      case 'check_functions':
        // Force re-check of available functions
        await checkRpcFunctions();
        responseData = {
          pgrest_exec: hasPgrestExec,
          pgrest_query: hasPgrestQuery,
          create_dummy_table: hasCreateDummyTable,
          message: hasPgrestExec ? "SQL execution available" : "Limited mode: Please run SQL migrations"
        };
        break;
        
      default:
        throw new Error(`Unknown command: ${command}`);
    }
    
    // Send successful response
    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      data: responseData
    }));
    
  } catch (error) {
    // Handle errors
    console.error(`Error processing request (${command}):`, error.message);
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
});

// Check for required functions only if not in mock mode
if (!useMockData && supabase) {
  checkRpcFunctions().then(() => {
    createDummyTable().catch(error => {
      console.warn('Could not create dummy table:', error.message);
    });
  }).catch(error => {
    console.warn('Error checking RPC functions:', error.message);
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`Supabase MCP Server running at http://localhost:${PORT}/`);
  console.log('Available commands:');
  console.log('  - status: Check connection status and capabilities');
  console.log('  - list_tables: List all tables');
  console.log('  - query: Execute SQL queries (requires RPC functions)');
  console.log('  - execute: Execute SQL statements (requires RPC functions)');
  console.log('  - run_migration: Apply migration file (requires RPC functions)');
  console.log('  - check_functions: Check for required RPC functions');
  
  if (useMockData) {
    console.log('⚠️ Running in MOCK mode - update backend/.env with real credentials ⚠️');
  } else if (!hasPgrestExec && !hasPgrestQuery) {
    console.log('⚠️ Limited functionality mode - please run SQL migrations to enable SQL execution ⚠️');
    console.log('  Run: ./supabase/apply-migrations.sh');
  } else {
    console.log('✅ Connected to Supabase with SQL execution capability');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Supabase MCP Server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 