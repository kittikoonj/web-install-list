const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

function check(url) {
  return new Promise((resolve) => {
    http
      .get(url, (res) => {
        resolve(res.statusCode && res.statusCode >= 200 && res.statusCode < 500);
      })
      .on('error', () => resolve(false));
  });
}

function keepAlive() {
  setInterval(() => {}, 1 << 30);
}

async function main() {
  const healthUrl = 'http://127.0.0.1:3000/api/health';
  if (await check(healthUrl)) {
    console.log('[e2e] API already running on :3000');
    keepAlive();
    return;
  }

  console.log('[e2e] Starting API...');
  const child = spawn('npm', ['run', 'start:dev'], {
    cwd: path.join(__dirname, '../../api'),
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code) => process.exit(code ?? 1));
}

main();
