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
  const webUrl = 'http://localhost:4200';
  if (await check(webUrl)) {
    console.log('[e2e] Web already running on :4200');
    keepAlive();
    return;
  }

  console.log('[e2e] Starting web dev server...');
  const child = spawn('npm', ['start'], {
    cwd: path.join(__dirname, '../../web'),
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code) => process.exit(code ?? 1));
}

main();
