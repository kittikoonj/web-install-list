CREATE DATABASE IF NOT EXISTS install_list CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE install_list;

CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  label VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  is_delete TINYINT DEFAULT 0,
  deleted_by VARCHAR(100),
  deleted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  menu_key VARCHAR(50) NOT NULL,
  can_access TINYINT DEFAULT 0,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  UNIQUE KEY uk_role_menu (role_id, menu_key)
);

CREATE TABLE IF NOT EXISTS setting_os (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS setting_program_names (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS setting_customer_names (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS programs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  os_id INT NULL,
  version VARCHAR(50),
  github_url VARCHAR(500) NOT NULL,
  methods JSON NOT NULL,
  icon VARCHAR(100) NOT NULL,
  icon_bg VARCHAR(20) NOT NULL,
  icon_fg VARCHAR(20) NOT NULL,
  note TEXT,
  created_by VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_delete TINYINT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  deleted_by VARCHAR(100),
  deleted_at DATETIME,
  FOREIGN KEY (os_id) REFERENCES setting_os(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS install_lists (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  created_by VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_delete TINYINT DEFAULT 0,
  deleted_by VARCHAR(100),
  deleted_at DATETIME
);

CREATE TABLE IF NOT EXISTS install_list_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  list_id INT NOT NULL,
  program_id INT NOT NULL,
  method ENUM('offline','docker','online') NOT NULL,
  FOREIGN KEY (list_id) REFERENCES install_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id)
);

CREATE TABLE IF NOT EXISTS install_list_customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  list_id INT NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  installer_name VARCHAR(100) NOT NULL,
  installed_at DATE NOT NULL,
  test_case_url VARCHAR(500),
  FOREIGN KEY (list_id) REFERENCES install_lists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS install_list_customer_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  item_id INT NOT NULL,
  is_installed TINYINT DEFAULT 0,
  UNIQUE KEY uk_customer_item (customer_id, item_id),
  FOREIGN KEY (customer_id) REFERENCES install_list_customers(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES install_list_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS install_list_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  list_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT DEFAULT 0,
  uploaded_by VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES install_lists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS issues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  install_list_id INT NOT NULL,
  customer_name VARCHAR(200),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
  created_by VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_delete TINYINT DEFAULT 0,
  deleted_by VARCHAR(100),
  deleted_at DATETIME,
  FOREIGN KEY (install_list_id) REFERENCES install_lists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS issue_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  issue_id INT NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_type ENUM('image','file') NOT NULL,
  file_size INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS issue_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  issue_id INT NOT NULL,
  body TEXT NOT NULL,
  created_by VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action ENUM('create','update','delete') NOT NULL,
  object_type VARCHAR(50) NOT NULL,
  object_id INT,
  object_name VARCHAR(200),
  details TEXT,
  performed_by VARCHAR(100),
  performed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (id, name, label) VALUES
  (1, 'super_admin', 'Super Admin'),
  (2, 'manager', 'Manager'),
  (3, 'user', 'User'),
  (4, 'viewer', 'Viewer')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO role_permissions (role_id, menu_key, can_access) VALUES
  (1, 'dashboard', 1),
  (1, 'install_lists', 1),
  (1, 'issues', 1),
  (1, 'programs', 1),
  (1, 'users', 1),
  (1, 'roles', 1),
  (1, 'audit_log', 1),
  (1, 'settings', 1),
  (2, 'dashboard', 1),
  (2, 'install_lists', 1),
  (2, 'issues', 1),
  (2, 'programs', 1),
  (2, 'users', 0),
  (2, 'roles', 0),
  (2, 'audit_log', 1),
  (2, 'settings', 0),
  (3, 'dashboard', 1),
  (3, 'install_lists', 1),
  (3, 'issues', 1),
  (3, 'programs', 0),
  (3, 'users', 0),
  (3, 'roles', 0),
  (3, 'audit_log', 0),
  (3, 'settings', 0),
  (4, 'dashboard', 1),
  (4, 'install_lists', 1),
  (4, 'issues', 1),
  (4, 'programs', 0),
  (4, 'users', 0),
  (4, 'roles', 0),
  (4, 'audit_log', 0),
  (4, 'settings', 0)
ON DUPLICATE KEY UPDATE can_access = VALUES(can_access);

INSERT INTO setting_os (name, sort_order) VALUES
  ('Windows', 1),
  ('Linux', 2),
  ('macOS', 3),
  ('Ubuntu', 4)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);

-- Default admin: admin@example.com / admin123
INSERT INTO users (name, email, password, role_id, status) VALUES
  ('Super Admin', 'admin@example.com', '$2b$10$swqSWewtFXcBMKYvyfiEZelu8ouT9aZ4fyatTWRi6oXYoT7r2CYN2', 1, 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name);
