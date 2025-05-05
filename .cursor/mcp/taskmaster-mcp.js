const { spawn } = require('child_process');
const path = require('path');

// Helper function to run taskmaster commands and return their output
function runTaskmasterCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const taskmaster = spawn('npx', ['task-master-ai', command, ...args], {
      cwd: process.cwd(),
      shell: true
    });
    
    let stdout = '';
    let stderr = '';
    
    taskmaster.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    taskmaster.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    taskmaster.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

// Implement MCP tool functions
module.exports = {
  get_tasks: async (options = {}) => {
    const args = [];
    if (options.status) args.push('-s', options.status);
    if (options.withSubtasks) args.push('--with-subtasks');
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('list', args);
  },
  
  get_task: async (options = {}) => {
    if (!options.id) {
      throw new Error("Task ID is required");
    }
    
    const args = [options.id];
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('show', args);
  },
  
  next_task: async (options = {}) => {
    const args = [];
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('next', args);
  },
  
  add_task: async (options = {}) => {
    if (!options.prompt) {
      throw new Error("Prompt is required");
    }
    
    const args = ['-p', options.prompt];
    if (options.dependencies) args.push('-d', options.dependencies);
    if (options.priority) args.push('--priority', options.priority);
    if (options.research) args.push('-r');
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('add-task', args);
  },
  
  add_subtask: async (options = {}) => {
    if (!options.id) {
      throw new Error("Parent ID is required");
    }
    
    const args = ['-p', options.id];
    if (options.taskId) args.push('-i', options.taskId);
    if (options.title) args.push('-t', options.title);
    if (options.description) args.push('-d', options.description);
    if (options.details) args.push('--details', options.details);
    if (options.dependencies) args.push('--dependencies', options.dependencies);
    if (options.status) args.push('-s', options.status);
    if (options.skipGenerate) args.push('--skip-generate');
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('add-subtask', args);
  },
  
  update_subtask: async (options = {}) => {
    if (!options.id) {
      throw new Error("Subtask ID is required");
    }
    if (!options.prompt) {
      throw new Error("Prompt is required");
    }
    
    const args = ['-i', options.id, '-p', options.prompt];
    if (options.research) args.push('-r');
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('update-subtask', args);
  },
  
  update_task: async (options = {}) => {
    if (!options.id) {
      throw new Error("Task ID is required");
    }
    if (!options.prompt) {
      throw new Error("Prompt is required");
    }
    
    const args = ['-i', options.id, '-p', options.prompt];
    if (options.research) args.push('-r');
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('update-task', args);
  },
  
  update: async (options = {}) => {
    if (!options.from) {
      throw new Error("From task ID is required");
    }
    if (!options.prompt) {
      throw new Error("Prompt is required");
    }
    
    const args = ['--from', options.from, '-p', options.prompt];
    if (options.research) args.push('-r');
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('update', args);
  },
  
  set_task_status: async (options = {}) => {
    if (!options.id) {
      throw new Error("Task ID is required");
    }
    if (!options.status) {
      throw new Error("Status is required");
    }
    
    const args = ['-i', options.id, '-s', options.status];
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('set-status', args);
  },
  
  expand_task: async (options = {}) => {
    if (!options.id) {
      throw new Error("Task ID is required");
    }
    
    const args = ['-i', options.id];
    if (options.num) args.push('-n', options.num);
    if (options.research) args.push('-r');
    if (options.prompt) args.push('-p', options.prompt);
    if (options.force) args.push('--force');
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('expand', args);
  },
  
  expand_all: async (options = {}) => {
    const args = ['--all'];
    if (options.num) args.push('-n', options.num);
    if (options.research) args.push('-r');
    if (options.prompt) args.push('-p', options.prompt);
    if (options.force) args.push('--force');
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('expand', args);
  },
  
  clear_subtasks: async (options = {}) => {
    if (!options.id && !options.all) {
      throw new Error("Task ID or all flag is required");
    }
    
    const args = [];
    if (options.id) args.push('-i', options.id);
    if (options.all) args.push('--all');
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('clear-subtasks', args);
  },
  
  remove_subtask: async (options = {}) => {
    if (!options.id) {
      throw new Error("Subtask ID is required");
    }
    
    const args = ['-i', options.id];
    if (options.convert) args.push('-c');
    if (options.skipGenerate) args.push('--skip-generate');
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('remove-subtask', args);
  },
  
  add_dependency: async (options = {}) => {
    if (!options.id) {
      throw new Error("Task ID is required");
    }
    if (!options.dependsOn) {
      throw new Error("Depends on task ID is required");
    }
    
    const args = ['-i', options.id, '-d', options.dependsOn];
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('add-dependency', args);
  },
  
  remove_dependency: async (options = {}) => {
    if (!options.id) {
      throw new Error("Task ID is required");
    }
    if (!options.dependsOn) {
      throw new Error("Depends on task ID is required");
    }
    
    const args = ['-i', options.id, '-d', options.dependsOn];
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('remove-dependency', args);
  },
  
  validate_dependencies: async (options = {}) => {
    const args = [];
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('validate-dependencies', args);
  },
  
  fix_dependencies: async (options = {}) => {
    const args = [];
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('fix-dependencies', args);
  },
  
  analyze_project_complexity: async (options = {}) => {
    const args = [];
    if (options.output) args.push('-o', options.output);
    if (options.threshold) args.push('-t', options.threshold);
    if (options.research) args.push('-r');
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('analyze-complexity', args);
  },
  
  complexity_report: async (options = {}) => {
    const args = [];
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('complexity-report', args);
  },
  
  generate: async (options = {}) => {
    const args = [];
    if (options.output) args.push('-o', options.output);
    if (options.file) args.push('-f', options.file);
    
    return await runTaskmasterCommand('generate', args);
  }
}; 