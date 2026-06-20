#!/bin/bash
# =========================================================
# GE-Energy MQTT Broker Setup — Ubuntu 24.04 (Vultr VPS)
# Run this script on the VPS as root:
#   bash setup-mqtt-vps.sh
# =========================================================
set -e

MQTT_USER="${MQTT_USER:-gedevice}"
MQTT_PASS="${MQTT_PASS:-}"

if [ -z "$MQTT_PASS" ]; then
  echo "Usage: MQTT_USER=gedevice MQTT_PASS=yourpassword bash setup-mqtt-vps.sh"
  exit 1
fi

echo "=== Installing Mosquitto ==="
apt update -qq
apt install -y mosquitto mosquitto-clients ufw

echo "=== Creating MQTT user: $MQTT_USER ==="
mosquitto_passwd -c -b /etc/mosquitto/passwd "$MQTT_USER" "$MQTT_PASS"
chmod 600 /etc/mosquitto/passwd

echo "=== Writing Mosquitto config ==="
cat > /etc/mosquitto/conf.d/ge-energy.conf << 'EOF'
# GE-Energy MQTT Broker config
listener 1883

# Require authentication — no anonymous access
allow_anonymous false
password_file /etc/mosquitto/passwd

# Logging
log_dest file /var/log/mosquitto/mosquitto.log
log_type error
log_type warning
log_type notice
log_type information
EOF

echo "=== Configuring firewall ==="
ufw allow 22/tcp   comment "SSH"
ufw allow 1883/tcp comment "MQTT"
ufw --force enable

echo "=== Starting Mosquitto ==="
systemctl enable mosquitto
systemctl restart mosquitto
systemctl status mosquitto --no-pager

echo ""
echo "===================================================="
echo "  MQTT Broker ready!"
echo "  Host    : $(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo "  Port    : 1883"
echo "  User    : $MQTT_USER"
echo "  Test    : mosquitto_sub -h localhost -p 1883 -u $MQTT_USER -P '$MQTT_PASS' -t 'ge/#' -v"
echo "===================================================="
