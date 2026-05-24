#!/usr/bin/env bash
# WSL: expose MySQL on port 3307 so Windows phpMyAdmin can use geserverhub (avoids MySQL80 on 3306).
# Run in WSL: bash scripts/setup-wsl-mysql-for-phpmyadmin.sh

set -euo pipefail
APP_PASS="${DB_PASSWORD:-2350400018644}"
CNF="/etc/mysql/mysql.conf.d/mysqld.cnf"

if [[ ! -f "$CNF" ]]; then
  echo "MySQL config not found: $CNF"
  exit 1
fi

sudo sed -i 's/^bind-address.*/bind-address = 0.0.0.0/' "$CNF"
if grep -q '^port' "$CNF"; then
  sudo sed -i 's/^port.*/port = 3307/' "$CNF"
else
  echo -e '\nport = 3307' | sudo tee -a "$CNF" >/dev/null
fi

sudo service mysql restart
sleep 2

sudo mysql -e "
CREATE USER IF NOT EXISTS 'geserverhub'@'%' IDENTIFIED BY '${APP_PASS}';
GRANT ALL PRIVILEGES ON geserverhub.* TO 'geserverhub'@'%';
FLUSH PRIVILEGES;
"

WSL_IP="$(hostname -I | awk '{print $1}')"
echo ""
echo "WSL MySQL is on port 3307."
echo "In phpMyAdmin use host: ${WSL_IP}  port: 3307  user: geserverhub  password: (from .env.local)"
echo "Or add a second server in C:\\xampp\\phpMyAdmin\\config.inc.php with that host/port."
