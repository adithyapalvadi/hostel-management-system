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

CREATE TABLE IF NOT EXISTS USERS (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Manager') DEFAULT 'Manager',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

USE smart_hostel_db;

-- ─────────────────────────────────────────
-- STEP 1: DISABLE FK CHECKS & CLEAR ALL
-- ─────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE FINE;
TRUNCATE TABLE COMPLAINT;
TRUNCATE TABLE ENTRY_LOG;
TRUNCATE TABLE VISITOR;
TRUNCATE TABLE ROOM_ALLOCATION;
TRUNCATE TABLE STUDENT;
TRUNCATE TABLE ROOM;
TRUNCATE TABLE HOSTEL;
TRUNCATE TABLE ZIP;

SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────
-- STEP 2: INSERT SAMPLE DATA
-- ─────────────────────────────────────────

-- ZIP
INSERT INTO ZIP (zip_code, city, state) VALUES
('600001', 'Chennai', 'Tamil Nadu'),
('600002', 'Chennai', 'Tamil Nadu'),
('600003', 'Chennai', 'Tamil Nadu'),
('600004', 'Chennai', 'Tamil Nadu'),
('110001', 'Delhi',   'Delhi');

-- HOSTEL
INSERT INTO HOSTEL (hostel_id, hostel_name, type, street, zip_code) VALUES
('H001', 'MH1', 'Boys',  'Main Campus Rd',  '600001'),
('H002', 'MH2', 'Boys',  'North Block Rd',  '600001'),
('H003', 'LH1', 'Girls', 'South Campus Rd', '600002'),
('H004', 'LH2', 'Girls', 'West Campus Rd',  '600002'),
('H005', 'MH3', 'Boys',  'East Campus Rd',  '600003');

-- ROOM
INSERT INTO ROOM (room_number, capacity, floor, hostel_id) VALUES
('101', 3, 1, 'H001'),
('102', 2, 1, 'H001'),
('201', 4, 2, 'H002'),
('301', 3, 3, 'H003'),
('102', 2, 1, 'H004');

-- STUDENT
INSERT INTO STUDENT (student_id, name, gender, department, phone, email) VALUES
('24BCE1001', 'Arjun R',  'Male',   'CSE',  '9876543210', 'arjun@vit.ac.in'),
('24BCE1002', 'Priya S',  'Female', 'ECE',  '9876543211', 'priya@vit.ac.in'),
('24BCE1003', 'Rahul T',  'Male',   'MECH', '9876543212', 'rahul@vit.ac.in'),
('24BCE1004', 'Sneha K',  'Female', 'CSE',  '9876543213', 'sneha@vit.ac.in'),
('24BCE1005', 'Kiran M',  'Male',   'EEE',  '9876543214', 'kiran@vit.ac.in');

-- ROOM_ALLOCATION
INSERT INTO ROOM_ALLOCATION (student_id, room_id, from_date, to_date) VALUES
('24BCE1001', 1, '2025-07-01', '2025-11-30'),
('24BCE1002', 4, '2025-07-01', '2025-11-30'),
('24BCE1003', 2, '2025-07-01', '2025-11-30'),
('24BCE1004', 5, '2025-07-01', '2025-11-30'),
('24BCE1005', 3, '2025-07-01', '2025-11-30');

-- VISITOR
INSERT INTO VISITOR (visitor_name, relation, phone, student_id) VALUES
('Mr. Rajan',   'Father', '9998887770', '24BCE1001'),
('Mrs. Priya',  'Mother', '9998887771', '24BCE1001'),
('Mr. Kumar',   'Uncle',  '9998887772', '24BCE1002'),
('Ms. Lakshmi', 'Sister', '9998887773', '24BCE1003'),
('Mr. Babu',    'Father', '9998887774', '24BCE1004');

-- ENTRY_LOG
INSERT INTO ENTRY_LOG (visitor_id, entry_time, exit_time, visit_duration) VALUES
(1, '2025-07-10 10:00:00', '2025-07-10 12:00:00', 120),
(2, '2025-07-10 09:30:00', '2025-07-10 11:30:00', 120),
(3, '2025-07-11 14:00:00', '2025-07-11 15:30:00', 90),
(4, '2025-07-12 11:00:00', '2025-07-12 12:30:00', 90),
(5, '2025-07-13 13:00:00', '2025-07-13 14:00:00', 60);

-- COMPLAINT
INSERT INTO COMPLAINT (student_id, complaint_type, description, complaint_date, status) VALUES
('24BCE1001', 'Maintenance', 'Fan not working',   '2025-07-10', 'Resolved'),
('24BCE1002', 'Food',        'Cold food served',  '2025-07-12', 'Pending'),
('24BCE1003', 'Security',    'Lock broken',       '2025-07-13', 'In Progress'),
('24BCE1004', 'Maintenance', 'No water supply',   '2025-07-14', 'Resolved'),
('24BCE1005', 'Hygiene',     'Washroom dirty',    '2025-07-15', 'Pending');

-- FINE
INSERT INTO FINE (complaint_id, amount, fine_date, reason, status) VALUES
(1, 500.00,  '2025-07-11', 'Late fee',        'Paid'),
(2, 200.00,  '2025-07-13', 'Damage',          'Unpaid'),
(3, 1000.00, '2025-07-14', 'Security breach', 'Paid'),
(4, 300.00,  '2025-07-15', 'Repeated issue',  'Unpaid'),
(5, 150.00,  '2025-07-16', 'Hygiene fine',    'Paid');