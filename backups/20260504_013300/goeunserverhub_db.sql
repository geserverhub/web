/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: 127.0.0.1    Database: spfoods_db
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) DEFAULT 'admin',
  `dept_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_username` (`username`),
  KEY `idx_dept_id` (`dept_id`),
  CONSTRAINT `admin_users_ibfk_1` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES
(11,'admin_production','$2b$10$.rpdwHmId//7P720FaTb.OMeHYOKddTO3jRwIJR6IoqF9dCBVTiM.','manager','production','2026-05-03 13:14:07'),
(12,'admin_accounting','$2b$10$pZOpy1Rk50qIwakamT/TFOytn0M1mTOHyib9L20XIbXWxYmUZPDDG','manager','accounting','2026-05-03 13:14:07'),
(13,'admin_admin','$2b$10$AracHP8tsb/KnjPKm9n4Eu68NiG9nss1lX.5LgjETJLCzRjopYKGG','manager','admin','2026-05-03 13:14:08'),
(14,'admin_delivery','$2b$10$CCffrQxg8hQrmK/3Ogj8Be.tgUqpEgQu9lxYpcu6ahbqmezyail0O','manager','delivery','2026-05-03 13:14:08'),
(15,'admin_qc','$2b$10$f43tie6djQ7iYRDqEZ564egIWC1zOSnkq/64Frd5S3jalT.qIE0Fu','manager','qc','2026-05-03 13:14:08'),
(16,'admin_sales','$2b$10$y2bEbvzFMvLOkCktXRTcD.yjXGh8JO1MfTVxO8Wnyuj1DtkDlKWtC','manager','sales','2026-05-03 13:14:08'),
(17,'owner','$2b$10$KtJmVEJKps11hqbRLMSfEuododdCD1ObPGpDQUeg5kAqYHKB7y0GW','superadmin',NULL,'2026-05-03 13:14:09');
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `claims_returns`
--

DROP TABLE IF EXISTS `claims_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `claims_returns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `claim_no` varchar(50) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `delivery_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `claim_date` date DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `claim_no` (`claim_no`),
  KEY `invoice_id` (`invoice_id`),
  KEY `delivery_id` (`delivery_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `claims_returns_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `claims_returns_ibfk_2` FOREIGN KEY (`delivery_id`) REFERENCES `delivery_notes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `claims_returns_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claims_returns`
--

LOCK TABLES `claims_returns` WRITE;
/*!40000 ALTER TABLE `claims_returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `claims_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contract_items`
--

DROP TABLE IF EXISTS `contract_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `contract_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contract_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `qty` decimal(12,2) DEFAULT 1.00,
  `price_unit` decimal(12,2) DEFAULT 0.00,
  `discount` decimal(12,2) DEFAULT 0.00,
  `amount` decimal(12,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_contract_id` (`contract_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contract_items`
--

LOCK TABLES `contract_items` WRITE;
/*!40000 ALTER TABLE `contract_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `contract_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contracts`
--

DROP TABLE IF EXISTS `contracts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `contracts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contract_no` varchar(30) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `title` varchar(300) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `value` decimal(12,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT 'active',
  `note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `customer_address` text DEFAULT NULL,
  `customer_tax_id` varchar(20) DEFAULT NULL,
  `contract_date` date DEFAULT NULL,
  `payment_type` varchar(20) DEFAULT 'cash',
  `payment_terms` varchar(100) DEFAULT 'ชำระทันที',
  `currency` varchar(10) DEFAULT 'THB',
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `vat_amount` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) DEFAULT 0.00,
  `created_by` varchar(50) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `content` longtext DEFAULT NULL,
  `contact_name` varchar(200) DEFAULT NULL,
  `company_phone` varchar(50) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `seller_name` varchar(200) DEFAULT NULL,
  `seller_address` text DEFAULT NULL,
  `seller_tax_id` varchar(20) DEFAULT NULL,
  `seller_contact_name` varchar(200) DEFAULT NULL,
  `seller_company_phone` varchar(50) DEFAULT NULL,
  `seller_contact_phone` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contract_no` (`contract_no`),
  KEY `customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contracts`
--

LOCK TABLES `contracts` WRITE;
/*!40000 ALTER TABLE `contracts` DISABLE KEYS */;
INSERT INTO `contracts` VALUES
(5,'CNT-20260503-0001',NULL,'ร้านอาหารโกเอิน','สัญญาจัดส่งอาหารแช่แข็ง','2026-01-01','2026-12-31',120000.00,'active',NULL,'2026-05-03 13:15:56',NULL,NULL,NULL,'cash','ชำระทันที','THB',0.00,0.00,0.00,NULL,'2026-05-03 14:09:04',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `contracts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `credit_notes`
--

DROP TABLE IF EXISTS `credit_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `credit_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `credit_note_no` varchar(50) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT 0.00,
  `vat_amount` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) DEFAULT 0.00,
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `credit_note_no` (`credit_note_no`),
  KEY `invoice_id` (`invoice_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `credit_notes_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `credit_notes_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `credit_notes`
--

LOCK TABLES `credit_notes` WRITE;
/*!40000 ALTER TABLE `credit_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `credit_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `crm_tracking`
--

DROP TABLE IF EXISTS `crm_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_tracking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `contract_no` varchar(30) DEFAULT NULL,
  `interaction_type` varchar(50) NOT NULL,
  `service_stage` enum('pre-sale','during','post-sale') NOT NULL,
  `description` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `idx_contract_no` (`contract_no`),
  CONSTRAINT `crm_tracking_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_tracking`
--

LOCK TABLES `crm_tracking` WRITE;
/*!40000 ALTER TABLE `crm_tracking` DISABLE KEYS */;
INSERT INTO `crm_tracking` VALUES
(11,5,NULL,'inquiry','during',NULL,NULL,'admin','2026-05-03 15:21:58','2026-05-03 16:06:53'),
(12,5,NULL,'call','during',NULL,NULL,'admin','2026-05-03 15:28:35','2026-05-03 16:06:51');
/*!40000 ALTER TABLE `crm_tracking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(50) DEFAULT NULL,
  `customer_name` varchar(200) NOT NULL,
  `contact_person` varchar(200) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `tax_id` varchar(20) DEFAULT NULL,
  `balance` decimal(12,2) DEFAULT 0.00,
  `credit_limit` decimal(12,2) DEFAULT 0.00,
  `credit_days` int(11) DEFAULT 30,
  `note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `currency` varchar(10) DEFAULT 'THB',
  `subdistrict` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'ไทย',
  `payment_type` enum('cash','credit') DEFAULT 'cash',
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_code` (`customer_code`),
  KEY `idx_name` (`customer_name`),
  KEY `idx_code` (`customer_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES
(5,'C-001','ร้านอาหารโกเอิน','นายโกเอิน','0912345678','goeun@example.com','123 ถ.พระราม 4 กรุงเทพฯ','1234567890123',0.00,50000.00,30,NULL,'2026-05-03 13:15:56','2026-05-03 13:15:56','THB',NULL,NULL,NULL,'ไทย','cash'),
(6,'C-002','บจก. เกาหลีฟู้ดส์','นางสาวมินจี','0898765432','minji@korea.com','456 ถ.สีลม กรุงเทพฯ','9876543210987',0.00,100000.00,45,NULL,'2026-05-03 13:15:56','2026-05-03 13:15:56','THB',NULL,NULL,NULL,'ไทย','cash'),
(7,'C-003','ห้างสรรพสินค้า เอ็ม','นายสมชาย','0823456789','somchai@mall.com','789 ถ.รัชดา กรุงเทพฯ','1122334455667',0.00,200000.00,60,NULL,'2026-05-03 13:15:56','2026-05-03 13:15:56','THB',NULL,NULL,NULL,'ไทย','cash'),
(8,'C-004','ร้าน K-Thai Market','นางกิมอา','0867891234','kimah@kthai.kr','Seoul, Korea',NULL,0.00,30000.00,30,NULL,'2026-05-03 13:15:56','2026-05-03 13:15:56','THB',NULL,NULL,NULL,'ไทย','cash'),
(9,'C-TEST','ทดสอบ',NULL,'0800000001',NULL,NULL,NULL,0.00,0.00,0,NULL,'2026-05-03 13:26:32','2026-05-03 13:26:32','THB',NULL,NULL,NULL,'ไทย','cash');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_note_items`
--

DROP TABLE IF EXISTS `delivery_note_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_note_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `delivery_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(200) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `qty` decimal(12,2) DEFAULT 1.00,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `idx_delivery` (`delivery_id`),
  CONSTRAINT `delivery_note_items_ibfk_1` FOREIGN KEY (`delivery_id`) REFERENCES `delivery_notes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `delivery_note_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_note_items`
--

LOCK TABLES `delivery_note_items` WRITE;
/*!40000 ALTER TABLE `delivery_note_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_note_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_notes`
--

DROP TABLE IF EXISTS `delivery_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `delivery_no` varchar(50) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `delivery_address` text DEFAULT NULL,
  `delivery_date` date DEFAULT NULL,
  `driver_name` varchar(200) DEFAULT NULL,
  `vehicle_plate` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `delivery_no` (`delivery_no`),
  KEY `invoice_id` (`invoice_id`),
  KEY `customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`delivery_date`),
  CONSTRAINT `delivery_notes_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `delivery_notes_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_notes`
--

LOCK TABLES `delivery_notes` WRITE;
/*!40000 ALTER TABLE `delivery_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dept_id` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `employee_count` int(11) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `dept_id` (`dept_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES
(13,'production','แผนกผลิตและดูแลพนักงานต่างชาติ',12,1,'2026-05-03 13:14:07'),
(14,'accounting','แผนกบัญชีภาษีและลูกหนี้',5,2,'2026-05-03 13:14:07'),
(15,'admin','แผนกธุรการขาย-ซื้อ',8,3,'2026-05-03 13:14:07'),
(16,'delivery','แผนกติดต่องานภายนอกและจัดส่ง',10,4,'2026-05-03 13:14:07'),
(17,'qc','แผนกควบคุมคุณภาพและR&D',6,5,'2026-05-03 13:14:07'),
(18,'sales','แผนกขายและการตลาด',9,6,'2026-05-03 13:14:07');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_categories`
--

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` VALUES
(8,'ค่าวัตถุดิบ','2026-05-03 13:15:56'),
(9,'ค่าแรงงาน','2026-05-03 13:15:56'),
(10,'ค่าสาธารณูปโภค','2026-05-03 13:15:56'),
(11,'ค่าขนส่ง','2026-05-03 13:15:56'),
(12,'ค่าซ่อมบำรุง','2026-05-03 13:15:56'),
(13,'ค่าบรรจุภัณฑ์','2026-05-03 13:15:56'),
(14,'ค่าใช้จ่ายทั่วไป','2026-05-03 13:15:56');
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_no` varchar(50) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `expense_date` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT 0.00,
  `vat_amount` decimal(12,2) DEFAULT 0.00,
  `net_amount` decimal(12,2) DEFAULT 0.00,
  `dept_id` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `expense_no` (`expense_no`),
  KEY `category_id` (`category_id`),
  KEY `dept_id` (`dept_id`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`expense_date`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods_receipt_items`
--

DROP TABLE IF EXISTS `goods_receipt_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods_receipt_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(200) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `qty_ordered` decimal(12,2) DEFAULT 0.00,
  `qty_received` decimal(12,2) DEFAULT 0.00,
  `price_unit` decimal(12,2) DEFAULT 0.00,
  `amount` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `idx_receipt` (`receipt_id`),
  CONSTRAINT `goods_receipt_items_ibfk_1` FOREIGN KEY (`receipt_id`) REFERENCES `goods_receipts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `goods_receipt_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods_receipt_items`
--

LOCK TABLES `goods_receipt_items` WRITE;
/*!40000 ALTER TABLE `goods_receipt_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `goods_receipt_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods_receipts`
--

DROP TABLE IF EXISTS `goods_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods_receipts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_no` varchar(50) NOT NULL,
  `po_id` int(11) DEFAULT NULL,
  `supplier_name` varchar(200) DEFAULT NULL,
  `receipt_date` date DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT 0.00,
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_no` (`receipt_no`),
  KEY `po_id` (`po_id`),
  KEY `idx_date` (`receipt_date`),
  CONSTRAINT `goods_receipts_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods_receipts`
--

LOCK TABLES `goods_receipts` WRITE;
/*!40000 ALTER TABLE `goods_receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `goods_receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(200) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `qty` decimal(12,2) DEFAULT 1.00,
  `price_unit` decimal(12,2) DEFAULT 0.00,
  `amount` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_invoice` (`invoice_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(50) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
  `customer_tax_id` varchar(20) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `vat_amount` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) DEFAULT 0.00,
  `paid_amount` decimal(12,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `idx_status` (`status`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_date` (`issue_date`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_feedback`
--

DROP TABLE IF EXISTS `order_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `so_id` int(11) DEFAULT NULL,
  `so_no` varchar(30) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `issue_type` varchar(50) NOT NULL,
  `priority` enum('high','medium','low') DEFAULT 'medium',
  `description` text NOT NULL,
  `status` varchar(20) DEFAULT 'open',
  `resolution` text DEFAULT NULL,
  `resolved_by` varchar(50) DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_so` (`so_id`),
  CONSTRAINT `order_feedback_ibfk_1` FOREIGN KEY (`so_id`) REFERENCES `sales_orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_feedback_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_feedback`
--

LOCK TABLES `order_feedback` WRITE;
/*!40000 ALTER TABLE `order_feedback` DISABLE KEYS */;
INSERT INTO `order_feedback` VALUES
(2,NULL,NULL,NULL,NULL,'quality','medium','ทดสอบ feedback','open',NULL,NULL,NULL,'admin','2026-05-03 13:22:56','2026-05-03 13:22:56'),
(3,4,'SO-20260503-00001',NULL,'ร้านอาหารโกเอิน','quantity','medium','2322','open',NULL,NULL,NULL,'admin','2026-05-03 15:16:50','2026-05-03 15:16:50');
/*!40000 ALTER TABLE `order_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(50) NOT NULL,
  `customer_name` varchar(200) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `item` varchar(500) NOT NULL,
  `status` enum('packing','shipping','delivered') DEFAULT 'packing',
  `location` varchar(500) DEFAULT 'กำลังเตรียมพัสดุ',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `idx_status` (`status`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES
(7,'SPF-2026-001','สมชาย ใจดี','0812345678','อาหารแช่แข็ง x3','delivered','จัดส่งสำเร็จ','2026-05-03 13:14:09','2026-05-03 13:14:09'),
(8,'SPF-2026-002','กิ่งแก้ว สว่าง','0898765432','อาหารแปรรูป x2','shipping','กำลังจัดส่ง — กรุงเทพฯ','2026-05-03 13:14:09','2026-05-03 13:14:09'),
(9,'SPF-2026-003','อนุสรณ์ เจริญ','0823456789','อาหารแช่แข็งพรีเมียม x1','packing','กำลังเตรียมพัสดุ','2026-05-03 13:14:09','2026-05-03 13:14:09');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_categories`
--

DROP TABLE IF EXISTS `product_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_categories`
--

LOCK TABLES `product_categories` WRITE;
/*!40000 ALTER TABLE `product_categories` DISABLE KEYS */;
INSERT INTO `product_categories` VALUES
(1,'อาหารแช่แข็ง','2026-05-03 13:20:01'),
(2,'อาหารแปรรูป','2026-05-03 13:20:01'),
(3,'เครื่องปรุง','2026-05-03 13:20:01'),
(4,'ของแห้ง','2026-05-03 13:20:01'),
(5,'เครื่องดื่ม','2026-05-03 13:20:01');
/*!40000 ALTER TABLE `product_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_orders`
--

DROP TABLE IF EXISTS `production_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_no` varchar(50) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `qty_ordered` decimal(12,2) DEFAULT 0.00,
  `qty_produced` decimal(12,2) DEFAULT 0.00,
  `production_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `dept_id` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `product_id` (`product_id`),
  KEY `dept_id` (`dept_id`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`production_date`),
  CONSTRAINT `production_orders_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `production_orders_ibfk_2` FOREIGN KEY (`dept_id`) REFERENCES `departments` (`dept_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_orders`
--

LOCK TABLES `production_orders` WRITE;
/*!40000 ALTER TABLE `production_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `production_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_code` varchar(50) NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `price_cost` decimal(12,2) DEFAULT 0.00,
  `price_cost_thb` decimal(12,2) DEFAULT 0.00,
  `price_cost_krw` decimal(12,2) DEFAULT 0.00,
  `price_cost_usd` decimal(12,3) DEFAULT 0.000,
  `price_cost_cny` decimal(12,2) DEFAULT 0.00,
  `price_sell` decimal(12,2) DEFAULT 0.00,
  `price_sell_thb` decimal(12,2) DEFAULT 0.00,
  `price_sell_krw` decimal(12,2) DEFAULT 0.00,
  `price_sell_usd` decimal(12,3) DEFAULT 0.000,
  `price_sell_cny` decimal(12,2) DEFAULT 0.00,
  `stock_qty` decimal(12,2) DEFAULT 0.00,
  `min_stock` decimal(12,2) DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_code` (`product_code`),
  KEY `idx_code` (`product_code`),
  KEY `idx_cat` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES
(34,'SPF-001','ลาบหมูแช่แข็ง 500g',1,'ถุง',150.00,150.00,6000.00,4.050,30.00,350.00,350.00,14000.00,9.450,70.00,200.00,20.00,NULL,'1777820084435-343120277.jpg',1,'2026-05-03 13:20:01','2026-05-03 15:15:26'),
(35,'SPF-002','ส้มตำปู 400g',1,'ถุง',38.00,38.00,1520.00,1.026,7.60,75.00,75.00,3000.00,2.025,15.00,150.00,15.00,NULL,NULL,1,'2026-05-03 13:20:01','2026-05-03 15:09:42'),
(36,'SPF-003','ต้มแซ่บแช่แข็ง 600g',1,'ถุง',55.00,55.00,2200.00,1.485,11.00,99.00,99.00,3960.00,2.673,19.80,100.00,10.00,NULL,NULL,1,'2026-05-03 13:20:01','2026-05-03 15:09:42'),
(37,'SPF-004','ไส้กรอกอีสาน 500g',2,'ถุง',60.00,60.00,2400.00,1.620,12.00,120.00,120.00,4800.00,3.240,24.00,300.00,30.00,NULL,NULL,1,'2026-05-03 13:20:01','2026-05-03 15:09:42'),
(38,'SPF-005','หมูยอ 300g',2,'ก้อน',35.00,35.00,1400.00,0.945,7.00,65.00,65.00,2600.00,1.755,13.00,250.00,25.00,NULL,NULL,1,'2026-05-03 13:20:01','2026-05-03 15:09:42'),
(39,'SPF-006','น้ำพริกปลาร้า 200g',3,'ขวด',25.00,25.00,1000.00,0.675,5.00,49.00,49.00,1960.00,1.323,9.80,500.00,50.00,NULL,NULL,1,'2026-05-03 13:20:01','2026-05-03 15:09:42'),
(40,'SPF-007','ข้าวเหนียวมูน 250g',2,'ห่อ',20.00,20.00,800.00,0.540,4.00,39.00,39.00,1560.00,1.053,7.80,400.00,40.00,NULL,NULL,1,'2026-05-03 13:20:01','2026-05-03 15:09:42'),
(41,'SPF-008','ปลาร้าบอง 300g',3,'ขวด',30.00,30.00,1200.00,0.810,6.00,59.00,59.00,2360.00,1.593,11.80,200.00,20.00,NULL,NULL,1,'2026-05-03 13:20:01','2026-05-03 15:09:42');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `po_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(200) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `qty` decimal(12,2) DEFAULT 1.00,
  `price_unit` decimal(12,2) DEFAULT 0.00,
  `amount` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `idx_po` (`po_id`),
  CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `purchase_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `po_no` varchar(50) NOT NULL,
  `supplier_name` varchar(200) DEFAULT NULL,
  `supplier_contact` varchar(200) DEFAULT NULL,
  `order_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `po_no` (`po_no`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`order_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quality_checks`
--

DROP TABLE IF EXISTS `quality_checks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quality_checks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `check_no` varchar(50) NOT NULL,
  `production_order_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `check_date` date DEFAULT NULL,
  `qty_checked` decimal(12,2) DEFAULT 0.00,
  `qty_pass` decimal(12,2) DEFAULT 0.00,
  `qty_fail` decimal(12,2) DEFAULT 0.00,
  `result` varchar(20) DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `check_no` (`check_no`),
  KEY `production_order_id` (`production_order_id`),
  KEY `product_id` (`product_id`),
  KEY `idx_date` (`check_date`),
  CONSTRAINT `quality_checks_ibfk_1` FOREIGN KEY (`production_order_id`) REFERENCES `production_orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quality_checks_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quality_checks`
--

LOCK TABLES `quality_checks` WRITE;
/*!40000 ALTER TABLE `quality_checks` DISABLE KEYS */;
/*!40000 ALTER TABLE `quality_checks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registration_types`
--

DROP TABLE IF EXISTS `registration_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration_types`
--

LOCK TABLES `registration_types` WRITE;
/*!40000 ALTER TABLE `registration_types` DISABLE KEYS */;
INSERT INTO `registration_types` VALUES
(5,'ลูกค้าทั่วไป','2026-05-03 13:15:56'),
(6,'ตัวแทนจำหน่าย','2026-05-03 13:15:56'),
(7,'พนักงาน','2026-05-03 13:15:56'),
(8,'ผู้จัดจำหน่าย','2026-05-03 13:15:56');
/*!40000 ALTER TABLE `registration_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registrations`
--

DROP TABLE IF EXISTS `registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `email` varchar(200) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `company` varchar(200) DEFAULT NULL,
  `address` text NOT NULL,
  `purpose` varchar(50) NOT NULL,
  `registration_type_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'new',
  `status_updated_at` timestamp NULL DEFAULT NULL,
  `note` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registrations`
--

LOCK TABLES `registrations` WRITE;
/*!40000 ALTER TABLE `registrations` DISABLE KEYS */;
INSERT INTO `registrations` VALUES
(4,'test','t@t.com','08',NULL,'test','buy',NULL,'2026-05-03 13:22:56','new',NULL,NULL);
/*!40000 ALTER TABLE `registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_order_items`
--

DROP TABLE IF EXISTS `sales_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `so_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `qty` decimal(12,2) DEFAULT 1.00,
  `price_unit` decimal(12,2) DEFAULT 0.00,
  `discount` decimal(12,2) DEFAULT 0.00,
  `amount` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `idx_so` (`so_id`),
  CONSTRAINT `sales_order_items_ibfk_1` FOREIGN KEY (`so_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sales_order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_order_items`
--

LOCK TABLES `sales_order_items` WRITE;
/*!40000 ALTER TABLE `sales_order_items` DISABLE KEYS */;
INSERT INTO `sales_order_items` VALUES
(5,4,37,'ไส้กรอกอีสาน 500g','ถุง',10.00,12000.00,0.00,120000.00),
(6,4,38,'หมูยอ 300g','ก้อน',10.00,6500.00,0.00,65000.00);
/*!40000 ALTER TABLE `sales_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_orders`
--

DROP TABLE IF EXISTS `sales_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `so_no` varchar(30) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
  `customer_tax_id` varchar(20) DEFAULT NULL,
  `so_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `payment_type` varchar(20) DEFAULT 'cash',
  `payment_terms` varchar(50) DEFAULT 'ชำระทันที',
  `currency` varchar(5) DEFAULT 'THB',
  `contract_no` varchar(30) DEFAULT NULL,
  `contract_id` int(11) DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `vat_amount` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT 'draft',
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `so_no` (`so_no`),
  KEY `customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`so_date`),
  KEY `fk_so_contract` (`contract_id`),
  CONSTRAINT `fk_so_contract` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_orders`
--

LOCK TABLES `sales_orders` WRITE;
/*!40000 ALTER TABLE `sales_orders` DISABLE KEYS */;
INSERT INTO `sales_orders` VALUES
(4,'SO-20260503-00001',5,'ร้านอาหารโกเอิน','123 ถ.พระราม 4 กรุงเทพฯ','1234567890123','2026-05-03','2026-05-11','transfer','ชำระภายใน 30 วัน','KRW','CNT-20260503-0001',5,185000.00,18500.00,203500.00,'draft','ทดสอบ',NULL,'2026-05-03 14:34:28','2026-05-03 14:34:28');
/*!40000 ALTER TABLE `sales_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock`
--

DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `qty` decimal(12,2) DEFAULT 0.00,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_id` (`product_id`),
  CONSTRAINT `stock_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock`
--

LOCK TABLES `stock` WRITE;
/*!40000 ALTER TABLE `stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `movement_type` varchar(20) NOT NULL,
  `ref_type` varchar(30) DEFAULT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `qty` decimal(12,2) NOT NULL,
  `qty_before` decimal(12,2) DEFAULT NULL,
  `qty_after` decimal(12,2) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_product` (`product_id`),
  KEY `idx_ref` (`ref_type`,`ref_id`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tax_invoices`
--

DROP TABLE IF EXISTS `tax_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tax_invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tax_invoice_no` varchar(50) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
  `customer_tax_id` varchar(20) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `vat_amount` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) DEFAULT 0.00,
  `note` text DEFAULT NULL,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tax_invoice_no` (`tax_invoice_no`),
  KEY `customer_id` (`customer_id`),
  KEY `idx_invoice` (`invoice_id`),
  CONSTRAINT `tax_invoices_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tax_invoices_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tax_invoices`
--

LOCK TABLES `tax_invoices` WRITE;
/*!40000 ALTER TABLE `tax_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `tax_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'spfoods_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-04  1:35:03
