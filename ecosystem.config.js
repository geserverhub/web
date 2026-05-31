const fs = require('fs');
const path = require('path');

// Load .env.local manually so PM2 picks up all vars
const envLocalPath = path.join(__dirname, '.env.local');
const env = {};
if (fs.existsSync(envLocalPath)) {
  fs.readFileSync(envLocalPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
}

module.exports = {
  apps: [
    {
      name: 'GEserverhub',
      script: 'npm',
      args: 'start',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        ...env,
      },
    },
  ],
};
