# WSL native project: ~/web

โปรเจกต์ copy ไปที่ **`~/web`** (Linux filesystem) แทน `/mnt/c/web/web` — dev เร็วกว่ามาก

## รัน dev

```bash
cd ~/web
npm run dev
```

หรือจาก Windows: double-click `start-dev.bat` (ชี้ไป `~/web` แล้ว)

## เปิดเว็บ

- WSL: `http://localhost:3005/`
- Windows browser: `http://<WSL-IP>:3005/` (`wsl hostname -I`)

## sync โค้ดจาก Windows (หลังแก้ใน Cursor ที่ `C:\web\web`)

```bash
rsync -a --exclude node_modules --exclude .next /mnt/c/web/web/ ~/web/
```

## เร็วขึ้น (ทางเลือก)

```bash
cd ~/web
npm run dev:fast   # Turbopack
```
