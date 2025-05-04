// Script to install the Supabase MCP server
const { execSync } = require('child_process');

try {
  console.log('Installing Supabase MCP server using npx...');
  execSync(
    'npx -y @smithery/cli@latest install @Anthony9906/supabase-mcp-server --client cursor --profile royal-bass-AGAqzo --key c7b6569b-f906-4f55-8dd7-3b6aa0443ebc', 
    { stdio: 'inherit' }
  );
  
  console.log('\nInstallation completed successfully!');
} catch (error) {
  console.error('Installation failed:', error.message);
  process.exit(1);
} 