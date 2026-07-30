-- ============================================================
-- Finance / Loan Tracker — Database Schema
-- Run in MySQL Workbench, or: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS finance_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE finance_db;

-- users : app operators who log in
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120)  NOT NULL,
  email      VARCHAR(190)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,   -- bcrypt hash
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- password_resets : one-time tokens for "forgot password"
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used       TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- customers : borrowers tracked by a user
CREATE TABLE IF NOT EXISTS customers (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL,
  name                VARCHAR(150) NOT NULL,
  mobile_number       VARCHAR(20)  NOT NULL,
  national_id_number  VARCHAR(60)  NOT NULL,
  customer_photo      VARCHAR(255) DEFAULT NULL,
  initial_loan_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- transactions : ADD (loan given, increases balance owed)
--                MINUS (repayment, decreases balance owed)
CREATE TABLE IF NOT EXISTS transactions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  customer_id      INT NOT NULL,
  type             ENUM('ADD','MINUS') NOT NULL,
  amount           DECIMAL(12,2) NOT NULL,
  transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_customers_user ON customers(user_id);
