const { pool } = require('../utils/db');
const crypto = require('crypto');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const {
  bookingCreated,
  technicianAssigned,
  statusChanged,
  bookingAccepted,
  bookingRejected,
  serviceCompleted,
} = require('../events/bookingEvents');
const { withTransaction } = require('../utils/transaction');

const generateBookingRef = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const date = `${parts.year}${parts.month}${parts.day}`;
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SB-${date}-${rand}`;
};

const isValidSchedule = (date, time) => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time)) return false;
  const [year, month, day] = date.split('-').map(Number);
  const normalizedDate = new Date(Date.UTC(year, month - 1, day));
  if (normalizedDate.getUTCFullYear() !== year || normalizedDate.getUTCMonth() !== month - 1 || normalizedDate.getUTCDate() !== day) return false;
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${normalizedTime}+08:00`) >= new Date();
};

const asSqlDate = (value) => {
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value).map(({ type, value: part }) => [type, part]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  return '';
};

const asSqlTime = (value) => {
  if (typeof value === 'string') return value.slice(0, 8);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(value).map(({ type, value: part }) => [type, part]));
    return `${parts.hour}:${parts.minute}:${parts.second}`;
  }
  return '';
};

const BOOKING_QUERY = `
  SELECT b.*, 
    u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
    s.name AS service_name, s.category AS service_category, s.icon AS service_icon,
    t.name AS technician_name, t.phone AS technician_phone,
    tech.specialization, tech.rating AS technician_rating
  FROM bookings b
  JOIN users u ON b.customer_id = u.id
  JOIN services s ON b.service_id = s.id
  LEFT JOIN users t ON b.technician_id = t.id
  LEFT JOIN technicians tech ON b.technician_id = tech.user_id
`;

const getBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const offset = (page - 1) * limit;
    let where = ' WHERE 1=1';
    const params = [];

    if (req.user.role === 'customer') { where += ' AND b.customer_id = ?'; params.push(req.user.id); }
    else if (req.user.role === 'technician') { where += ' AND b.technician_id = ?'; params.push(req.user.id); }
    if (status) { where += ' AND b.status = ?'; params.push(status); }

    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM bookings b${where}`, params);
    const total = countRows[0].total;

    const [rows] = await pool.execute(`${BOOKING_QUERY}${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return paginatedResponse(res, rows, total, page, limit);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch bookings.', 500);
  }
};

const getBookingById = async (req, res) => {
  try {
    const [rows] = await pool.execute(`${BOOKING_QUERY} WHERE b.id = ?`, [req.params.id]);
    if (!rows.length) return errorResponse(res, 'Booking not found.', 404);
    const booking = rows[0];

    if (req.user.role === 'customer' && booking.customer_id !== req.user.id) return errorResponse(res, 'Access denied.', 403);
    if (req.user.role === 'technician' && booking.technician_id !== req.user.id) return errorResponse(res, 'Access denied.', 403);

    const [history] = await pool.execute(
      'SELECT bsh.*, u.name AS changed_by_name FROM booking_status_history bsh JOIN users u ON bsh.changed_by = u.id WHERE bsh.booking_id = ? ORDER BY bsh.changed_at ASC',
      [booking.id]
    );
    const [notes] = await pool.execute(
      'SELECT sn.*, u.name AS technician_name FROM service_notes sn JOIN users u ON sn.technician_id = u.id WHERE sn.booking_id = ? ORDER BY sn.created_at DESC',
      [booking.id]
    );
    const [invoice] = await pool.execute('SELECT * FROM invoices WHERE booking_id = ?', [booking.id]);
    const [review] = await pool.execute('SELECT * FROM reviews WHERE booking_id = ?', [booking.id]);

    return successResponse(res, { booking: { ...booking, history, notes, invoice: invoice[0] || null, review: review[0] || null } });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch booking.', 500);
  }
};

const createBooking = async (req, res) => {
  const { service_id, booking_date, booking_time, service_address, description, latitude, longitude } = req.body;
  if (!service_id || !booking_date || !booking_time || !service_address) {
    return errorResponse(res, 'Service, date, time, and address are required.', 400);
  }
  if (!isValidSchedule(booking_date, booking_time)) {
    return errorResponse(res, 'Choose a valid booking date and time in the future.', 400);
  }
  if (typeof service_address !== 'string' || !service_address.trim()) {
    return errorResponse(res, 'A valid service address is required.', 400);
  }
  if (latitude != null && (!Number.isFinite(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90)) {
    return errorResponse(res, 'Latitude must be between -90 and 90.', 400);
  }
  if (longitude != null && (!Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)) {
    return errorResponse(res, 'Longitude must be between -180 and 180.', 400);
  }

  try {
    const booking = await withTransaction(async (connection) => {
      const [services] = await connection.execute(
        "SELECT * FROM services WHERE id = ? AND status = 'active' FOR UPDATE",
        [service_id]
      );
      if (!services.length) {
        const error = new Error('Service not found or unavailable.');
        error.statusCode = 404;
        throw error;
      }

      const booking_reference = generateBookingRef();
      const [result] = await connection.execute(
        'INSERT INTO bookings (booking_reference, customer_id, service_id, booking_date, booking_time, service_address, latitude, longitude, description, status, estimated_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [booking_reference, req.user.id, service_id, booking_date, booking_time, service_address.trim(), latitude ?? null, longitude ?? null, description || null, 'Pending', services[0].base_price]
      );

      const newBooking = {
        id: result.insertId,
        booking_reference,
        customer_id: req.user.id,
        service_name: services[0].name,
        estimated_cost: services[0].base_price,
      };
      await connection.execute(
        'INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
        [newBooking.id, null, 'Pending', req.user.id]
      );
      await bookingCreated(connection, newBooking, req.user.id, req.ip);
      return newBooking;
    });

    return successResponse(res, { booking_reference: booking.booking_reference, booking_id: booking.id, status: 'Pending', estimated_cost: booking.estimated_cost }, 'Booking created successfully.', 201);
  } catch (err) {
    if (err.statusCode === 404) return errorResponse(res, err.message, 404);
    console.error(err);
    return errorResponse(res, 'Failed to create booking.', 500);
  }
};

const updateBooking = async (req, res) => {
  const { booking_date, booking_time, service_address, description } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!rows.length) return errorResponse(res, 'Booking not found.', 404);
    const booking = rows[0];
    if (req.user.role === 'customer' && booking.customer_id !== req.user.id) return errorResponse(res, 'Access denied.', 403);
    if (!['customer', 'admin'].includes(req.user.role)) return errorResponse(res, 'Access denied.', 403);
    if (!['Pending', 'Confirmed'].includes(booking.status)) return errorResponse(res, 'Booking cannot be modified at this stage.', 400);

    const nextDate = booking_date ?? booking.booking_date;
    const nextTime = booking_time ?? booking.booking_time;
    if ((booking_date !== undefined || booking_time !== undefined) && !isValidSchedule(
      asSqlDate(nextDate),
      typeof nextTime === 'string' ? nextTime : String(nextTime).slice(0, 8)
    )) {
      return errorResponse(res, 'Choose a valid booking date and time in the future.', 400);
    }
    if (service_address !== undefined && (typeof service_address !== 'string' || !service_address.trim())) {
      return errorResponse(res, 'A valid service address is required.', 400);
    }
    await pool.execute(
      'UPDATE bookings SET booking_date=?, booking_time=?, service_address=?, description=? WHERE id=?',
      [nextDate, nextTime, service_address === undefined ? booking.service_address : service_address.trim(), description === undefined ? booking.description : description, req.params.id]
    );
    return successResponse(res, {}, 'Booking updated successfully.');
  } catch (err) {
    return errorResponse(res, 'Failed to update booking.', 500);
  }
};

const cancelBooking = async (req, res) => {
  try {
    const result = await withTransaction(async (connection) => {
      const [rows] = await connection.execute('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [req.params.id]);
      if (!rows.length) return { error: ['Booking not found.', 404] };
      const booking = rows[0];
      if (req.user.role === 'customer' && booking.customer_id !== req.user.id) return { error: ['Access denied.', 403] };
      if (!['customer', 'admin'].includes(req.user.role)) return { error: ['Access denied.', 403] };
      if (['Completed', 'Cancelled'].includes(booking.status)) return { error: ['Booking cannot be cancelled.', 400] };
      if (req.user.role === 'customer' && ['In Progress', 'On the Way'].includes(booking.status)) {
        return { error: ['Cannot cancel a booking that is already in progress.', 400] };
      }

      if (booking.technician_id) {
        await connection.execute('SELECT user_id FROM technicians WHERE user_id = ? FOR UPDATE', [booking.technician_id]);
      }
      await connection.execute("UPDATE bookings SET status = 'Cancelled' WHERE id = ?", [req.params.id]);
      if (booking.technician_id) {
        const [[{ activeJobs }]] = await connection.execute(
          "SELECT COUNT(*) AS activeJobs FROM bookings WHERE technician_id = ? AND status IN ('Assigned','Accepted','On the Way','In Progress')",
          [booking.technician_id]
        );
        if (activeJobs === 0) {
          await connection.execute("UPDATE technicians SET availability_status = 'available' WHERE user_id = ?", [booking.technician_id]);
        }
      }
      await connection.execute(
        'INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
        [booking.id, booking.status, 'Cancelled', req.user.id]
      );
      await statusChanged(connection, booking, booking.status, 'Cancelled', req.user.id, req.ip);
      return { success: true };
    });
    if (result.error) return errorResponse(res, result.error[0], result.error[1]);
    return successResponse(res, {}, 'Booking cancelled successfully.');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to cancel booking.', 500);
  }
};

const assignTechnician = async (req, res) => {
  const { technician_user_id } = req.body;
  const technicianId = Number(technician_user_id);
  if (!Number.isInteger(technicianId) || technicianId < 1) return errorResponse(res, 'A valid technician ID is required.', 400);
  try {
    const result = await withTransaction(async (connection) => {
      const [rows] = await connection.execute('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [req.params.id]);
      if (!rows.length) return { error: ['Booking not found.', 404] };
      const booking = rows[0];
      if (!['Pending', 'Confirmed', 'Rejected', 'Assigned'].includes(booking.status)) {
        return { error: ['A technician cannot be assigned at this stage.', 400] };
      }
      if (booking.technician_id === technicianId) {
        return { error: ['This technician is already assigned to the booking.', 409] };
      }

      const [technicians] = await connection.execute(
        "SELECT t.user_id FROM technicians t JOIN users u ON t.user_id = u.id WHERE t.user_id = ? AND t.availability_status = 'available' AND u.status = 'active' FOR UPDATE",
        [technicianId]
      );
      if (!technicians.length) return { error: ['Technician not available.', 400] };
      const [[{ activeJobs }]] = await connection.execute(
        "SELECT COUNT(*) AS activeJobs FROM bookings WHERE technician_id = ? AND status IN ('Assigned','Accepted','On the Way','In Progress')",
        [technicianId]
      );
      if (activeJobs > 0) return { error: ['Technician already has an active job.', 409] };

      await connection.execute(
        "UPDATE bookings SET technician_id = ?, status = 'Assigned' WHERE id = ?",
        [technicianId, req.params.id]
      );
      if (booking.technician_id) {
        const [[{ previousActiveJobs }]] = await connection.execute(
          "SELECT COUNT(*) AS previousActiveJobs FROM bookings WHERE technician_id = ? AND status IN ('Assigned','Accepted','On the Way','In Progress')",
          [booking.technician_id]
        );
        if (previousActiveJobs === 0) {
          await connection.execute("UPDATE technicians SET availability_status = 'available' WHERE user_id = ?", [booking.technician_id]);
        }
      }
      await connection.execute(
        "UPDATE technicians SET availability_status = 'busy' WHERE user_id = ?",
        [technicianId]
      );
      await connection.execute(
        'INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
        [booking.id, booking.status, 'Assigned', req.user.id]
      );
      const eventBooking = { ...booking, status: 'Assigned' };
      await technicianAssigned(connection, eventBooking, technicianId, req.user.id, req.ip);
      await statusChanged(connection, eventBooking, booking.status, 'Assigned', req.user.id, req.ip);
      return { success: true };
    });
    if (result.error) return errorResponse(res, result.error[0], result.error[1]);
    return successResponse(res, {}, 'Technician assigned successfully.');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to assign technician.', 500);
  }
};

const acceptBooking = async (req, res) => {
  try {
    const result = await withTransaction(async (connection) => {
      const [rows] = await connection.execute(
        `${BOOKING_QUERY} WHERE b.id = ? FOR UPDATE`,
        [req.params.id]
      );
      if (!rows.length) return { error: ['Booking not found.', 404] };
      const booking = rows[0];
      if (booking.technician_id !== req.user.id) return { error: ['Access denied.', 403] };
      if (booking.status !== 'Assigned') return { error: ['Booking is not in Assigned status.', 400] };

      await connection.execute("UPDATE bookings SET status = 'Accepted' WHERE id = ?", [req.params.id]);
      await connection.execute(
        'INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
        [booking.id, 'Assigned', 'Accepted', req.user.id]
      );
      await bookingAccepted(connection, booking, req.user.id, req.user.name, req.ip);
      return { success: true };
    });
    if (result.error) return errorResponse(res, result.error[0], result.error[1]);
    return successResponse(res, {}, 'Booking accepted.');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to accept booking.', 500);
  }
};

const rejectBooking = async (req, res) => {
  try {
    const result = await withTransaction(async (connection) => {
      const [rows] = await connection.execute(
        `${BOOKING_QUERY} WHERE b.id = ? FOR UPDATE`,
        [req.params.id]
      );
      if (!rows.length) return { error: ['Booking not found.', 404] };
      const booking = rows[0];
      if (booking.technician_id !== req.user.id) return { error: ['Access denied.', 403] };
      if (booking.status !== 'Assigned') return { error: ['Booking is not in Assigned status.', 400] };

      await connection.execute('SELECT user_id FROM technicians WHERE user_id = ? FOR UPDATE', [req.user.id]);
      await connection.execute(
        "UPDATE bookings SET status = 'Pending', technician_id = NULL WHERE id = ?",
        [req.params.id]
      );
      const [[{ activeJobs }]] = await connection.execute(
        "SELECT COUNT(*) AS activeJobs FROM bookings WHERE technician_id = ? AND status IN ('Assigned','Accepted','On the Way','In Progress')",
        [req.user.id]
      );
      if (activeJobs === 0) {
        await connection.execute("UPDATE technicians SET availability_status = 'available' WHERE user_id = ?", [req.user.id]);
      }
      await connection.execute(
        'INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
        [booking.id, 'Assigned', 'Pending', req.user.id]
      );
      await bookingRejected(connection, booking, req.user.id, req.user.name, req.ip);
      return { success: true };
    });
    if (result.error) return errorResponse(res, result.error[0], result.error[1]);
    return successResponse(res, {}, 'Booking rejected.');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to reject booking.', 500);
  }
};

const VALID_TRANSITIONS = {
  technician: { 'Accepted': 'On the Way', 'On the Way': 'In Progress', 'In Progress': 'Completed' },
  admin: { 'Pending': 'Confirmed', 'Rejected': 'Pending' },
};

const updateStatus = async (req, res) => {
  const { status, notes } = req.body;
  try {
    const result = await withTransaction(async (connection) => {
      const [rows] = await connection.execute(
        `${BOOKING_QUERY} WHERE b.id = ? FOR UPDATE`,
        [req.params.id]
      );
      if (!rows.length) return { error: ['Booking not found.', 404] };
      const booking = rows[0];
      if (req.user.role === 'technician' && booking.technician_id !== req.user.id) {
        return { error: ['Access denied.', 403] };
      }

      const allowed = VALID_TRANSITIONS[req.user.role] || {};
      if (allowed[booking.status] !== status) {
        return { error: [`Invalid status transition from ${booking.status} to ${status}.`, 400] };
      }
      if (notes && req.user.role === 'technician') {
        await connection.execute(
          'INSERT INTO service_notes (booking_id, technician_id, notes) VALUES (?, ?, ?)',
          [booking.id, req.user.id, notes]
        );
      }

      if (status === 'Completed') {
        const subtotal = Number(booking.estimated_cost);
        const serviceFee = (subtotal * 0.1).toFixed(2);
        const total = (subtotal + Number(serviceFee)).toFixed(2);
        const [existingInvoices] = await connection.execute(
          'SELECT invoice_number FROM invoices WHERE booking_id = ? FOR UPDATE',
          [booking.id]
        );
        const invoiceNumber = existingInvoices[0]?.invoice_number
          || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(booking.id).padStart(3, '0')}`;

        if (booking.technician_id) {
          await connection.execute('SELECT user_id FROM technicians WHERE user_id = ? FOR UPDATE', [booking.technician_id]);
        }
        await connection.execute(
          'UPDATE bookings SET status = ?, final_cost = ? WHERE id = ?',
          [status, total, booking.id]
        );
        await connection.execute(
          'INSERT INTO invoices (booking_id, invoice_number, subtotal, service_fee, total, payment_status) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE subtotal=VALUES(subtotal), service_fee=VALUES(service_fee), total=VALUES(total)',
          [booking.id, invoiceNumber, subtotal.toFixed(2), serviceFee, total, 'Pending']
        );
        if (booking.technician_id) {
          const [[{ activeJobs }]] = await connection.execute(
            "SELECT COUNT(*) AS activeJobs FROM bookings WHERE technician_id = ? AND status IN ('Assigned','Accepted','On the Way','In Progress')",
            [booking.technician_id]
          );
          if (activeJobs === 0) {
            await connection.execute("UPDATE technicians SET availability_status = 'available' WHERE user_id = ?", [booking.technician_id]);
          }
        }
        await connection.execute(
          'INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
          [booking.id, booking.status, status, req.user.id]
        );
        await serviceCompleted(connection, booking, req.user.id, invoiceNumber, total, req.ip);
      } else {
        await connection.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, booking.id]);
        await connection.execute(
          'INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
          [booking.id, booking.status, status, req.user.id]
        );
        await statusChanged(connection, booking, booking.status, status, req.user.id, req.ip);
      }
      return { success: true };
    });
    if (result.error) return errorResponse(res, result.error[0], result.error[1]);
    return successResponse(res, {}, `Status updated to ${status}.`);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to update status.', 500);
  }
};

const submitReview = async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return errorResponse(res, 'Rating must be between 1 and 5.', 400);
  try {
    const [rows] = await pool.execute('SELECT * FROM bookings WHERE id = ? AND customer_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return errorResponse(res, 'Booking not found.', 404);
    const booking = rows[0];
    if (booking.status !== 'Completed') return errorResponse(res, 'Can only review completed bookings.', 400);
    if (!booking.technician_id) return errorResponse(res, 'No technician assigned.', 400);

    const [existing] = await pool.execute('SELECT id FROM reviews WHERE booking_id = ?', [booking.id]);
    if (existing.length) return errorResponse(res, 'Review already submitted.', 409);

    await pool.execute('INSERT INTO reviews (booking_id, customer_id, technician_id, rating, comment) VALUES (?, ?, ?, ?, ?)', [booking.id, req.user.id, booking.technician_id, rating, comment || null]);

    const [avgRating] = await pool.execute('SELECT AVG(rating) as avg FROM reviews WHERE technician_id = ?', [booking.technician_id]);
    await pool.execute('UPDATE technicians SET rating = ? WHERE user_id = ?', [avgRating[0].avg, booking.technician_id]);

    return successResponse(res, {}, 'Review submitted successfully.', 201);
  } catch (err) {
    return errorResponse(res, 'Failed to submit review.', 500);
  }
};

module.exports = { getBookings, getBookingById, createBooking, updateBooking, cancelBooking, assignTechnician, acceptBooking, rejectBooking, updateStatus, submitReview };
