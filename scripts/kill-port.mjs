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
  let freed = false;
  try {
    const pids = execSync(`lsof -ti :${port} 2>/dev/null || true`, {
      encoding: 'utf8',
    }).trim();
    if (pids) {
      for (const pid of pids.split(/\s+/).filter(Boolean)) {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          console.log('killed pid', pid);
          freed = true;
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* lsof not available */
  }
  if (!freed) {
    try {
      execSync(`fuser -k ${port}/tcp 2>/dev/null`, { stdio: 'ignore' });
      console.log('freed port', port);
      freed = true;
    } catch {
      /* ignore */
    }
  }
  if (!freed) console.log('no process on port', port);
}
