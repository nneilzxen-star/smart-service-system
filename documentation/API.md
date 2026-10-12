# Smart Service System — API Documentation

Base URL: `http://localhost:5000/api`

Booking requests commit their booking state and outbox event together before returning. In-app notification and audit side effects are processed asynchronously; clients should fetch `/notifications` rather than assume they exist in the initial booking response. Event delivery uses RabbitMQ with at-least-once semantics, idempotent processing, bounded retries, and a dead-letter queue.

The web client and the native Expo app share this REST API. The mobile app exposes customer and technician workflows only; administrator and dispatcher features remain web-only. Set the mobile app's API address to the reachable API host followed by `/api`.

All protected endpoints require: `Authorization: Bearer <token>`

---

## Authentication

### POST /auth/register
Register a new user account.

**Request:**
```json
{ "name": "Juan dela Cruz", "email": "juan@example.com", "phone": "09001234567", "password": "Demo@1234", "role": "customer" }
```
**Response:**
```json
{ "success": true, "token": "<jwt>", "user": { "id": 1, "name": "Juan dela Cruz", "email": "juan@example.com", "role": "customer" } }
```

---

### POST /auth/login
Authenticate and receive a JWT token.

**Request:**
```json
{ "email": "admin@smartservice.test", "password": "Demo@1234" }
```
**Response:**
```json
{ "success": true, "token": "<jwt>", "user": { "id": 1, "name": "System Admin", "role": "admin" } }
```

---

### GET /auth/me
Get current authenticated user. **[Protected]**

**Response:**
```json
{ "success": true, "user": { "id": 1, "name": "System Admin", "email": "admin@smartservice.test", "role": "admin" } }
```

---

### PUT /auth/profile
Update user profile. **[Protected]**

**Request:** `{ "name": "New Name", "phone": "09001234567" }`

---

### PUT /auth/change-password
Change user password. **[Protected]**

**Request:** `{ "currentPassword": "old", "newPassword": "new_pass_123" }`

---

## Services

### GET /services
Get all active services. Public endpoint.

**Query params:** `?category=HVAC&status=active`

**Response:**
```json
{ "success": true, "services": [ { "id": 1, "name": "AC Repair", "base_price": 800.00, "category": "HVAC" } ] }
```

---

### POST /services
Create a new service. **[Admin only]**

**Request:**
```json
{ "name": "New Service", "description": "...", "category": "HVAC", "base_price": 500.00, "estimated_duration": 90 }
```

---

### PUT /services/:id
Update a service. **[Admin only]**

---

### DELETE /services/:id
Deactivate a service. **[Admin only]**

---

## Bookings

### GET /bookings
Get bookings. **[Protected]** — Customers see own bookings, Technicians see assigned, Admins see all.

**Query params:** `?status=Pending&page=1&limit=20`

---

### POST /bookings
Create a new booking. **[Customer/Admin]**

**Request:**
```json
{
  "service_id": 1,
  "booking_date": "2026-10-20",
  "booking_time": "10:00",
  "service_address": "123 Rizal St., Makati City",
  "description": "AC unit not cooling properly."
}
```
**Response:**
```json
{ "success": true, "booking_reference": "SB-20261020-1234", "booking_id": 9, "status": "Pending", "estimated_cost": 800.00 }
```

---

### GET /bookings/:id
Get booking details with history, notes, invoice, review. **[Protected]**

---

### PUT /bookings/:id
Update booking details (date, time, address). **[Protected]**

---

### DELETE /bookings/:id
Cancel a booking. **[Protected]**

---

### POST /bookings/:id/assign
Assign a technician to a booking. **[Admin only]**

**Request:** `{ "technician_user_id": 3 }`

---

### POST /bookings/:id/accept
Technician accepts an assigned booking. **[Technician only]**

---

### POST /bookings/:id/reject
Technician rejects an assigned booking. **[Technician only]**

---

### POST /bookings/:id/status
Update booking status. **[Technician/Admin]**

**Request:** `{ "status": "On the Way", "notes": "Optional service notes" }`

Valid technician transitions: `Accepted → On the Way → In Progress → Completed`

---

### POST /bookings/:id/review
Submit a customer review. **[Customer only]**

**Request:** `{ "rating": 5, "comment": "Excellent service!" }`

---

## Technicians

### GET /technicians/available
Get all technicians with availability status. **[Protected]**

### GET /technicians/all
Get all technicians (admin view). **[Admin only]**

### GET /technicians/stats
Get technician's own performance stats. **[Technician only]**

### PUT /technicians/availability
Update own availability. **[Technician only]**

**Request:** `{ "availability_status": "available" }` — values: `available | busy | offline`

---

## Notifications

### GET /notifications
Get current user's notifications. **[Protected]**

**Response:**
```json
{ "success": true, "notifications": [...], "unread_count": 3 }
```

### PUT /notifications/:id/read
Mark a notification as read. **[Protected]**

### PUT /notifications/read-all
Mark all notifications as read. **[Protected]**

---

## Admin

### GET /admin/dashboard
Get dashboard statistics and charts data. **[Admin only]**

**Response includes:** stats, recent_bookings, booking_trend, service_stats, tech_performance, recent_activity

---

### GET /admin/reports/bookings
Get booking report with filters. **[Admin only]**

**Query params:** `?from=2026-01-01&to=2026-12-31&status=Completed&service_id=1`

---

### GET /admin/reports/technicians
Get technician performance report. **[Admin only]**

---

### GET /admin/audit-logs
Get system audit logs. **[Admin only]**

**Query params:** `?page=1&limit=50&action=BOOKING_CREATED&module=BOOKING`

---

### GET /admin/users
Get all users. **[Admin only]**

**Query params:** `?role=customer&status=active`

---

### PUT /admin/users/:id
Update a user. **[Admin only]**

---

### DELETE /admin/users/:id
Deactivate a user. **[Admin only]**

---

### GET /admin/billing
Get all invoices. **[Admin only]**

---

### PUT /admin/billing/:id/payment
Update invoice payment status. **[Admin only]**

**Request:** `{ "payment_status": "Paid" }` — values: `Pending | Paid | Unpaid | Cancelled`

---

## Error Responses

All errors follow this format:
```json
{ "success": false, "message": "Human-readable error message" }
```

Common HTTP status codes:
- `400` — Bad Request / Validation Error
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (insufficient role)
- `404` — Not Found
- `409` — Conflict (duplicate)
- `500` — Internal Server Error
