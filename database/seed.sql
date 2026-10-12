-- Smart Service System - Seed Data
USE smart_service_db;

-- Demo Users (passwords are all: Demo@1234)
-- bcrypt hash of "Demo@1234"
INSERT INTO users (name, email, phone, password_hash, role, status) VALUES
('System Admin', 'admin@smartservice.test', '09001000001', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active'),
('Juan dela Cruz', 'customer@smartservice.test', '09001000002', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'active'),
('Mark Santos', 'technician@smartservice.test', '09001000003', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'active'),
('Maria Garcia', 'maria@smartservice.test', '09001000004', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'active'),
('Pedro Reyes', 'pedro@smartservice.test', '09001000005', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'active'),
('Ana Lim', 'ana@smartservice.test', '09001000006', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'active'),
('Carlo Mendoza', 'carlo@smartservice.test', '09001000007', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', 'active'),
('Rosa Bautista', 'rosa@smartservice.test', '09001000008', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'active');

-- Technician profiles
INSERT INTO technicians (user_id, specialization, availability_status, experience, rating) VALUES
(3, 'Air Conditioning & Electrical', 'available', 5, 4.80),
(5, 'Plumbing & General Maintenance', 'available', 3, 4.60),
(7, 'Computer & Network Systems', 'busy', 7, 4.90);

-- Services
INSERT INTO services (name, description, category, base_price, estimated_duration, icon, status) VALUES
('Air Conditioner Repair', 'Professional AC repair, cleaning, and maintenance service.', 'HVAC', 800.00, 120, 'wind', 'active'),
('Electrical Repair', 'Safe and certified electrical wiring, outlets, and panel repair.', 'Electrical', 600.00, 90, 'zap', 'active'),
('Plumbing Service', 'Pipe repair, leak fixing, drain unclogging, and installation.', 'Plumbing', 500.00, 90, 'droplets', 'active'),
('Appliance Repair', 'Repair of refrigerators, washing machines, ovens, and more.', 'Appliance', 700.00, 120, 'settings', 'active'),
('Computer/Laptop Repair', 'Hardware and software troubleshooting, virus removal, upgrades.', 'IT', 550.00, 90, 'monitor', 'active'),
('Internet/Wi-Fi Installation', 'Router setup, network configuration, and cable management.', 'IT', 450.00, 60, 'wifi', 'active'),
('Home Cleaning', 'Deep cleaning of rooms, kitchen, bathroom, and common areas.', 'Cleaning', 1200.00, 240, 'sparkles', 'active'),
('CCTV Installation', 'Security camera installation, wiring, and DVR/NVR setup.', 'Security', 2500.00, 180, 'camera', 'active'),
('General Maintenance', 'Painting, carpentry, minor repairs, and general handyman work.', 'Maintenance', 400.00, 120, 'hammer', 'active'),
('AC Installation', 'New air conditioner unit installation and setup.', 'HVAC', 1500.00, 180, 'wind', 'active');

-- Sample Bookings
INSERT INTO bookings (booking_reference, customer_id, service_id, technician_id, booking_date, booking_time, service_address, description, status, estimated_cost, final_cost) VALUES
('SB-20260101-001', 2, 1, 3, '2026-01-15', '09:00:00', '123 Rizal St., Makati City', 'AC unit not cooling properly, making loud noise.', 'Completed', 800.00, 950.00),
('SB-20260101-002', 4, 3, 5, '2026-01-16', '10:00:00', '456 Mabini Ave., Quezon City', 'Kitchen sink is leaking under the cabinet.', 'Completed', 500.00, 600.00),
('SB-20260101-003', 6, 5, 7, '2026-01-17', '14:00:00', '789 Bonifacio Blvd., Pasig City', 'Laptop not turning on, needs diagnosis.', 'Completed', 550.00, 550.00),
('SB-20260102-001', 2, 2, 3, '2026-01-20', '08:00:00', '123 Rizal St., Makati City', 'Circuit breaker keeps tripping.', 'In Progress', 600.00, NULL),
('SB-20260102-002', 4, 7, NULL, '2026-01-22', '09:00:00', '456 Mabini Ave., Quezon City', 'Full house deep cleaning needed.', 'Pending', 1200.00, NULL),
('SB-20260102-003', 6, 8, 5, '2026-01-23', '13:00:00', '789 Bonifacio Blvd., Pasig City', 'Install 4 CCTV cameras around the house.', 'Assigned', 2500.00, NULL),
('SB-20260103-001', 8, 4, NULL, '2026-01-25', '10:00:00', '321 Luna St., Taguig City', 'Refrigerator not cooling, making strange sounds.', 'Pending', 700.00, NULL),
('SB-20260103-002', 2, 6, 7, '2026-01-26', '11:00:00', '123 Rizal St., Makati City', 'Need Wi-Fi router setup and network configuration.', 'Accepted', 450.00, NULL);

-- Booking status history
INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, changed_at) VALUES
(1, NULL, 'Pending', 2, '2026-01-10 08:00:00'),
(1, 'Pending', 'Assigned', 1, '2026-01-10 09:00:00'),
(1, 'Assigned', 'Accepted', 3, '2026-01-10 09:30:00'),
(1, 'Accepted', 'On the Way', 3, '2026-01-15 08:30:00'),
(1, 'On the Way', 'In Progress', 3, '2026-01-15 09:15:00'),
(1, 'In Progress', 'Completed', 3, '2026-01-15 11:30:00'),
(2, NULL, 'Pending', 4, '2026-01-11 10:00:00'),
(2, 'Pending', 'Assigned', 1, '2026-01-11 11:00:00'),
(2, 'Assigned', 'Accepted', 5, '2026-01-11 11:30:00'),
(2, 'Accepted', 'On the Way', 5, '2026-01-16 09:30:00'),
(2, 'On the Way', 'In Progress', 5, '2026-01-16 10:15:00'),
(2, 'In Progress', 'Completed', 5, '2026-01-16 12:00:00'),
(3, NULL, 'Pending', 6, '2026-01-12 14:00:00'),
(3, 'Pending', 'Assigned', 1, '2026-01-12 15:00:00'),
(3, 'Assigned', 'Accepted', 7, '2026-01-12 15:30:00'),
(3, 'Accepted', 'On the Way', 7, '2026-01-17 13:30:00'),
(3, 'On the Way', 'In Progress', 7, '2026-01-17 14:15:00'),
(3, 'In Progress', 'Completed', 7, '2026-01-17 16:00:00'),
(4, NULL, 'Pending', 2, '2026-01-18 08:00:00'),
(4, 'Pending', 'Assigned', 1, '2026-01-18 09:00:00'),
(4, 'Assigned', 'Accepted', 3, '2026-01-18 09:30:00'),
(4, 'Accepted', 'On the Way', 3, '2026-01-20 07:30:00'),
(4, 'On the Way', 'In Progress', 3, '2026-01-20 08:15:00'),
(5, NULL, 'Pending', 4, '2026-01-19 09:00:00'),
(6, NULL, 'Pending', 6, '2026-01-20 13:00:00'),
(6, 'Pending', 'Assigned', 1, '2026-01-20 14:00:00'),
(7, NULL, 'Pending', 8, '2026-01-21 10:00:00'),
(8, NULL, 'Pending', 2, '2026-01-22 11:00:00'),
(8, 'Pending', 'Assigned', 1, '2026-01-22 12:00:00'),
(8, 'Assigned', 'Accepted', 7, '2026-01-22 12:30:00');

-- Invoices for completed bookings
INSERT INTO invoices (booking_id, invoice_number, subtotal, service_fee, total, payment_status) VALUES
(1, 'INV-20260115-001', 800.00, 150.00, 950.00, 'Paid'),
(2, 'INV-20260116-001', 500.00, 100.00, 600.00, 'Paid'),
(3, 'INV-20260117-001', 550.00, 0.00, 550.00, 'Paid');

-- Reviews
INSERT INTO reviews (booking_id, customer_id, technician_id, rating, comment) VALUES
(1, 2, 3, 5, 'Excellent service! Mark was very professional and fixed the AC quickly. Highly recommended!'),
(2, 4, 5, 4, 'Good service, Pedro was on time and fixed the leak efficiently. Will book again.'),
(3, 6, 7, 5, 'Carlo is very knowledgeable. Fixed my laptop in no time. Great technician!');

-- Service notes
INSERT INTO service_notes (booking_id, technician_id, notes) VALUES
(1, 3, 'Replaced capacitor and cleaned filters. AC now running at optimal performance. Recommended annual maintenance.'),
(2, 5, 'Fixed pipe joint under sink. Applied sealant. Tested for 30 minutes, no leaks detected.'),
(3, 7, 'Replaced faulty RAM module. Cleaned dust from cooling system. Installed updated drivers. System running normally.');

-- Notifications
INSERT INTO notifications (user_id, booking_id, title, message, notification_type, is_read) VALUES
(1, 5, 'New Booking Request', 'Maria Garcia has submitted a new booking for Home Cleaning service.', 'new_booking', 0),
(1, 7, 'New Booking Request', 'Rosa Bautista has submitted a new booking for Appliance Repair service.', 'new_booking', 0),
(1, 8, 'New Booking Request', 'Juan dela Cruz has submitted a new booking for Wi-Fi Installation service.', 'new_booking', 1),
(3, 4, 'New Job Assignment', 'You have been assigned to a new job: Electrical Repair for Juan dela Cruz.', 'assignment', 1),
(5, 6, 'New Job Assignment', 'You have been assigned to a new job: CCTV Installation for Ana Lim.', 'assignment', 0),
(7, 8, 'New Job Assignment', 'You have been assigned to a new job: Wi-Fi Installation for Juan dela Cruz.', 'assignment', 0),
(2, 1, 'Service Completed', 'Your AC Repair service has been completed. Please review your invoice.', 'completion', 1),
(4, 2, 'Service Completed', 'Your Plumbing service has been completed. Please review your invoice.', 'completion', 1),
(6, 3, 'Service Completed', 'Your Computer Repair service has been completed. Please review your invoice.', 'completion', 1),
(2, 4, 'Technician On the Way', 'Your technician Mark Santos is on the way to your location.', 'status_update', 1),
(6, 6, 'Technician Assigned', 'Pedro Reyes has been assigned to your CCTV Installation booking.', 'assignment', 0),
(2, 8, 'Booking Accepted', 'Carlo Mendoza has accepted your Wi-Fi Installation booking.', 'status_update', 0);

-- Audit logs
INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address) VALUES
(2, 'USER_REGISTERED', 'AUTH', 2, 'New customer account registered: Juan dela Cruz', '127.0.0.1'),
(3, 'USER_REGISTERED', 'AUTH', 3, 'New technician account registered: Mark Santos', '127.0.0.1'),
(2, 'BOOKING_CREATED', 'BOOKING', 1, 'Booking SB-20260101-001 created for AC Repair service', '127.0.0.1'),
(1, 'TECHNICIAN_ASSIGNED', 'DISPATCH', 1, 'Mark Santos assigned to booking SB-20260101-001', '127.0.0.1'),
(3, 'TECHNICIAN_ACCEPTED', 'BOOKING', 1, 'Mark Santos accepted booking SB-20260101-001', '127.0.0.1'),
(3, 'STATUS_CHANGED', 'BOOKING', 1, 'Booking SB-20260101-001 status changed from Accepted to On the Way', '127.0.0.1'),
(3, 'STATUS_CHANGED', 'BOOKING', 1, 'Booking SB-20260101-001 status changed from On the Way to In Progress', '127.0.0.1'),
(3, 'SERVICE_COMPLETED', 'BOOKING', 1, 'Booking SB-20260101-001 marked as Completed', '127.0.0.1'),
(1, 'INVOICE_CREATED', 'BILLING', 1, 'Invoice INV-20260115-001 generated for booking SB-20260101-001', '127.0.0.1'),
(4, 'BOOKING_CREATED', 'BOOKING', 2, 'Booking SB-20260101-002 created for Plumbing service', '127.0.0.1'),
(1, 'TECHNICIAN_ASSIGNED', 'DISPATCH', 2, 'Pedro Reyes assigned to booking SB-20260101-002', '127.0.0.1'),
(5, 'SERVICE_COMPLETED', 'BOOKING', 2, 'Booking SB-20260101-002 marked as Completed', '127.0.0.1'),
(1, 'INVOICE_CREATED', 'BILLING', 2, 'Invoice INV-20260116-001 generated for booking SB-20260101-002', '127.0.0.1'),
(6, 'BOOKING_CREATED', 'BOOKING', 3, 'Booking SB-20260101-003 created for Computer Repair service', '127.0.0.1'),
(7, 'SERVICE_COMPLETED', 'BOOKING', 3, 'Booking SB-20260101-003 marked as Completed', '127.0.0.1'),
(1, 'INVOICE_CREATED', 'BILLING', 3, 'Invoice INV-20260117-001 generated for booking SB-20260101-003', '127.0.0.1'),
(2, 'BOOKING_CREATED', 'BOOKING', 4, 'Booking SB-20260102-001 created for Electrical Repair service', '127.0.0.1'),
(4, 'BOOKING_CREATED', 'BOOKING', 5, 'Booking SB-20260102-002 created for Home Cleaning service', '127.0.0.1'),
(6, 'BOOKING_CREATED', 'BOOKING', 6, 'Booking SB-20260102-003 created for CCTV Installation service', '127.0.0.1'),
(8, 'BOOKING_CREATED', 'BOOKING', 7, 'Booking SB-20260103-001 created for Appliance Repair service', '127.0.0.1'),
(2, 'BOOKING_CREATED', 'BOOKING', 8, 'Booking SB-20260103-002 created for Wi-Fi Installation service', '127.0.0.1'),
(1, 'USER_LOGIN', 'AUTH', 1, 'Admin logged in successfully', '127.0.0.1'),
(2, 'USER_LOGIN', 'AUTH', 2, 'Customer Juan dela Cruz logged in', '127.0.0.1'),
(3, 'USER_LOGIN', 'AUTH', 3, 'Technician Mark Santos logged in', '127.0.0.1');
