import { execSync } from 'child_process';

const port = process.argv[2] || '3005';

if (process.platform === 'win32') {
  try {
    const out = execSync(
      `netstat -ano | findstr :${port}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const pids = new Set();
    for (const line of out.split('\n')) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log('killed pid', pid);
      } catch {
        /* ignore */
      }
    }
  } catch {
    console.log('no process on port', port);
  }
} else {
  try {
    execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
    console.log('freed port', port);
  } catch {
    console.log('no process on port', port);
  }
}
