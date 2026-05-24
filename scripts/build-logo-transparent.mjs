/**
 * Build transparent Logo-brand.png from public/momoge/Logo-brand.jpg
 * Run: node scripts/build-logo-transparent.mjs
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = path.join(root, 'public/momoge/Logo-brand.jpg');
const out = path.join(root, 'public/momoge/Logo-brand.png');

const py = `
from PIL import Image
from collections import deque

img = Image.open(r"${src.replace(/\\/g, '\\\\')}").convert('RGBA')
w, h = img.size
px = img.load()

def is_bg(r, g, b):
    return r < 80 and g < 80 and b < 80

visited = [[False] * w for _ in range(h)]
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if is_bg(*px[x, y][:3]):
            q.append((x, y))
            visited[y][x] = True
for y in range(h):
    for x in (0, w - 1):
        if not visited[y][x] and is_bg(*px[x, y][:3]):
            q.append((x, y))
            visited[y][x] = True

while q:
    x, y = q.popleft()
    px[x, y] = (0, 0, 0, 0)
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx] and is_bg(*px[nx, ny][:3]):
            visited[ny][nx] = True
            q.append((nx, ny))

bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)
img.save(r"${out.replace(/\\/g, '\\\\')}", 'PNG', optimize=True)
print('saved', r"${out.replace(/\\/g, '\\\\')}", img.size)
`;

const result = spawnSync('python', ['-c', py], { stdio: 'inherit', cwd: root });
if (result.status !== 0) process.exit(result.status ?? 1);
