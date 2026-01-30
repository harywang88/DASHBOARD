// PM2 Ecosystem Configuration
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'harywang-dashboard',
      script: 'server.js',
      cwd: '/var/www/harywang-dashboard',
      env: {
        PORT: 8080,
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'harywang-convert',
      script: 'server.js',
      cwd: '/var/www/harywang-dashboard/services/convert',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'harywang-pdf',
      script: 'server.js',
      cwd: '/var/www/harywang-dashboard/services/pdf/backend',
      env: {
        PORT: 3002,
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
