const path = require('path');

const root = __dirname;

module.exports = {
  apps: [
    {
      name: 'install-list-api',
      cwd: path.join(root, 'api'),
      script: 'dist/main.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: path.join(root, 'logs/api-error.log'),
      out_file: path.join(root, 'logs/api-out.log'),
      merge_logs: true,
      time: true,
    },
    {
      name: 'install-list-web',
      cwd: path.join(root, 'web'),
      script: 'pm2-server.cjs',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        WEB_PORT: 8080,
        API_TARGET: 'http://127.0.0.1:3000',
      },
      error_file: path.join(root, 'logs/web-error.log'),
      out_file: path.join(root, 'logs/web-out.log'),
      merge_logs: true,
      time: true,
    },
  ],
};
