const { randomUUID } = require('crypto');

const enqueueBookingEvent = async (connection, eventType, bookingId, payload) => {
  const eventId = randomUUID();
  await connection.execute(
    'INSERT INTO outbox_events (id, aggregate_type, aggregate_id, event_type, payload) VALUES (?, ?, ?, ?, ?)',
    [eventId, 'booking', bookingId, eventType, JSON.stringify(payload)]
  );
};

const bookingCreated = (connection, booking, userId, ipAddress) =>
  enqueueBookingEvent(connection, 'booking.created', booking.id, {
    booking,
    user_id: userId,
    ip_address: ipAddress,
  });

const technicianAssigned = (connection, booking, technicianUserId, adminId, ipAddress) =>
  enqueueBookingEvent(connection, 'booking.technician_assigned', booking.id, {
    booking,
    technician_user_id: technicianUserId,
    admin_id: adminId,
    ip_address: ipAddress,
  });

const statusChanged = (connection, booking, oldStatus, newStatus, changedBy, ipAddress) =>
  enqueueBookingEvent(connection, 'booking.status_changed', booking.id, {
    booking,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: changedBy,
    ip_address: ipAddress,
  });

const bookingAccepted = (connection, booking, technicianId, technicianName, ipAddress) =>
  enqueueBookingEvent(connection, 'booking.accepted', booking.id, {
    booking,
    technician_id: technicianId,
    technician_name: technicianName,
    ip_address: ipAddress,
  });

const bookingRejected = (connection, booking, technicianId, technicianName, ipAddress) =>
  enqueueBookingEvent(connection, 'booking.rejected', booking.id, {
    booking,
    technician_id: technicianId,
    technician_name: technicianName,
    ip_address: ipAddress,
  });

const serviceCompleted = (connection, booking, technicianId, invoiceNumber, total, ipAddress) =>
  enqueueBookingEvent(connection, 'booking.completed', booking.id, {
    booking,
    technician_id: technicianId,
    invoice_number: invoiceNumber,
    total,
    ip_address: ipAddress,
  });

module.exports = {
  bookingCreated,
  technicianAssigned,
  statusChanged,
  bookingAccepted,
  bookingRejected,
  serviceCompleted,
};
