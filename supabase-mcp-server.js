#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const { promisify } = require('util');
const fetch = require('node-fetch');

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

// Mock tables for development
const MOCK_TABLES = [
  'orders',
  'customers',
  'products',
  'order_items',
  'inventory',
  'suppliers'
];

// Function to execute queries against Supabase
async function executeSupabaseQuery(method, endpoint, body = null) {
  if (useMockData) {
    // Return mock data based on the endpoint
    if (endpoint === 'list_tables') {
      return MOCK_TABLES;
    } else if (endpoint.startsWith('query/')) {
      return [
        { id: 1, name: 'Mock Item 1', created_at: new Date().toISOString() },
        { id: 2, name: 'Mock Item 2', created_at: new Date().toISOString() }
      ];
    } else if (endpoint.startsWith('execute/')) {
      return { success: true, message: 'Mock execution successful' };
    }
    return null;
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error executing Supabase query:', error.message);
    throw error;
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
    }
  } catch (error) {
    console.error('Error parsing request body:', error.message);
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
          mockMode: useMockData
        };
        break;
        
      case 'list_tables':
        responseData = await executeSupabaseQuery('GET', 'list_tables');
        break;
        
      case 'query':
        if (!requestData.sql) {
          throw new Error('Missing SQL query in request body');
        }
        responseData = await executeSupabaseQuery('POST', 'query/' + encodeURIComponent(requestData.sql));
        break;
        
      case 'execute':
        if (!requestData.sql) {
          throw new Error('Missing SQL query in request body');
        }
        responseData = await executeSupabaseQuery('POST', 'execute/' + encodeURIComponent(requestData.sql));
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

// Start server
server.listen(PORT, () => {
  console.log(`Supabase MCP Server running at http://localhost:${PORT}/`);
  console.log('Available commands:');
  console.log('  - status: Check connection status');
  console.log('  - list_tables: List all tables');
  console.log('  - query: Execute a read-only SQL query');
  console.log('  - execute: Execute a SQL command that modifies data');
  console.log(`${useMockData ? '⚠️ Running in MOCK mode - update backend/.env with real credentials ⚠️' : '✅ Connected to Supabase'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Supabase MCP Server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 