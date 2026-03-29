CREATE DATABASE IF NOT EXISTS smart_hostel_db;
USE smart_hostel_db;

CREATE TABLE IF NOT EXISTS ZIP (
    zip_code VARCHAR(20) PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS HOSTEL (
    hostel_id VARCHAR(50) PRIMARY KEY,
    hostel_name VARCHAR(100) NOT NULL,
    type ENUM('Boys', 'Girls', 'Coed') NOT NULL,
    street VARCHAR(255) NOT NULL,
    zip_code VARCHAR(20),
    FOREIGN KEY (zip_code) REFERENCES ZIP(zip_code) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ROOM (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL,
    floor INT NOT NULL,
    hostel_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (hostel_id) REFERENCES HOSTEL(hostel_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS STUDENT (
    student_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    department VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS ROOM_ALLOCATION (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    room_id INT NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (room_id) REFERENCES ROOM(room_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS VISITOR (
    visitor_id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_name VARCHAR(100) NOT NULL,
    relation VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS ENTRY_LOG (
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id INT NOT NULL,
    entry_time DATETIME NOT NULL,
    exit_time DATETIME,
    visit_duration INT,
    FOREIGN KEY (visitor_id) REFERENCES VISITOR(visitor_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS COMPLAINT (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    complaint_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    complaint_date DATE NOT NULL,
    status ENUM('Pending', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Pending',
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS FINE (
    fine_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT,
    amount DECIMAL(10,2) NOT NULL,
    fine_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
    FOREIGN KEY (complaint_id) REFERENCES COMPLAINT(complaint_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Boilerplate Dummy Data
INSERT IGNORE INTO ZIP (zip_code, city, state) VALUES 
('10001', 'New York', 'NY'), 
('90001', 'Los Angeles', 'CA');

INSERT IGNORE INTO HOSTEL (hostel_id, hostel_name, type, street, zip_code) VALUES 
('24BCE1351', 'Alpha Residence', 'Coed', '123 College Ave', '10001'), 
('H-002', 'Beta Hall', 'Girls', '456 University Rd', '90001');

INSERT IGNORE INTO STUDENT (student_id, name, gender, department, phone, email) VALUES 
('S-1001', 'Alice Smith', 'Female', 'Computer Science', '555-1234', 'alice@test.com'), 
('S-1002', 'Bob Jones', 'Male', 'Mechanical Eng', '555-5678', 'bob@test.com');
