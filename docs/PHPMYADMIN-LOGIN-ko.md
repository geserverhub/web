# phpMyAdmin 로그인 (geserverhub 거부 오류)

## 원인

`http://localhost:8080/phpmyadmin/` 은 **Windows MySQL80** (`127.0.0.1:3306`) 에 연결됩니다.

`geserverhub` MySQL 사용자와 `goeunserverhub` DB 백업은 **WSL 안의 MySQL** 에만 있어서, Windows에서는 아래 오류가 납니다.

```
Access denied for user 'geserverhub'@'localhost'
```

## 방법 A — Windows MySQL에 사용자 만들기 (phpMyAdmin 그대로 사용)

### 1) root 로 로그인

phpMyAdmin 로그인 화면에서:

- **서버:** `127.0.0.1:3306` (기본, 첫 번째 서버)
- **사용자:** `root` (geserverhub 아님)
- **암호:** Windows MySQL 설치 시 정한 root 비밀번호

root 비밀번호를 모르면 MySQL80 비밀번호 재설정이 필요합니다. (XAMPP `resetroot.bat` 은 **XAMPP MySQL** 용이며, 지금 3306을 쓰는 것은 **MySQL80 서비스** 입니다.)

### 2) SQL 실행

로그인 후 **SQL** 탭에서 프로젝트 파일 내용을 붙여넣고 실행:

`scripts/grant-geserverhub-windows.sql`

### 3) geserverhub 로 다시 로그인

- 사용자: `geserverhub`
- 암호: `2350400018644` (`.env.local` 과 동일)

DB가 비어 있으면 PowerShell:

```powershell
cd c:\web\web
$env:MYSQL_ROOT_PASSWORD="여기에-root-비밀번호"
node scripts/setup-windows-db-user.mjs
```

---

## 방법 B — WSL MySQL 사용 (root 비밀번호 없을 때)

WSL 터미널에서:

```bash
cd /mnt/c/web/web
bash scripts/setup-wsl-mysql-for-phpmyadmin.sh
```

그다음 phpMyAdmin 로그인 화면 **서버 선택**에서:

- **WSL MySQL (goeunserverhub)** — `127.0.0.1:3307`
- 사용자: `geserverhub`
- 암호: `2350400018644`

---

## 앱(Next.js)과 DB

| 실행 위치 | DATABASE_URL |
|-----------|----------------|
| WSL `npm run dev` | `localhost:3306` → WSL MySQL (goeunserverhub OK) |
| Windows `npm run dev` | `localhost:3306` → MySQL80 (방법 A 필요) |

WSL에서 개발할 때: `npm run db:check` / `npm run dev:restart`
