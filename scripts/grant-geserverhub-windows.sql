-- Run in phpMyAdmin (SQL tab) while logged in as MySQL **root** on Windows (127.0.0.1:3306).
-- Not as geserverhub — that user does not exist on Windows MySQL yet.

CREATE DATABASE IF NOT EXISTS `geserverhub`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'geserverhub'@'localhost' IDENTIFIED BY '2350400018644';
GRANT ALL PRIVILEGES ON `geserverhub`.* TO 'geserverhub'@'localhost';
FLUSH PRIVILEGES;
