const statusNotifications = {
  'Accepted': {
    title: 'Booking Accepted',
    message: (reference) => `Your technician has accepted booking ${reference}.`,
  },
  'On the Way': {
    title: 'Technician On the Way',
    message: (reference) => `Your technician is on the way for booking ${reference}.`,
  },
  'In Progress': {
    title: 'Service Started',
    message: (reference) => `Service has started for booking ${reference}.`,
  },
  'Cancelled': {
    title: 'Booking Cancelled',
    message: (reference) => `Booking ${reference} has been cancelled.`,
  },
};

const addNotification = async (connection, { userId, bookingId, title, message, type }) => {
  await connection.execute(
    'INSERT INTO notifications (user_id, booking_id, title, message, notification_type) VALUES (?, ?, ?, ?, ?)',
    [userId, bookingId || null, title, message, type || 'general']
  );
};

const addAuditLog = async (connection, { userId, action, module, recordId, description, ipAddress }) => {
  await connection.execute(
    'INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
    [userId || null, action, module || null, recordId || null, description || null, ipAddress || null]
  );
};

const notifyAdmins = async (connection, notification) => {
  const [admins] = await connection.execute(
    "SELECT id FROM users WHERE role = 'admin' AND status = 'active'"
  );
  for (const admin of admins) {
    await addNotification(connection, { ...notification, userId: admin.id });
  }
};

const handleBookingCreated = async (connection, payload) => {
  const { booking } = payload;
  await notifyAdmins(connection, {
    bookingId: booking.id,
    title: 'New Booking Request',
    message: `A new booking (${booking.booking_reference}) has been submitted for ${booking.service_name}.`,
    type: 'new_booking',
  });
  await addAuditLog(connection, {
    userId: payload.user_id,
    action: 'BOOKING_CREATED',
    module: 'BOOKING',
    recordId: booking.id,
    description: `Booking ${booking.booking_reference} created for ${booking.service_name} service`,
    ipAddress: payload.ip_address,
  });
};

const handleTechnicianAssigned = async (connection, payload) => {
  const { booking, technician_user_id: technicianUserId } = payload;
  await addNotification(connection, {
    userId: technicianUserId,
    bookingId: booking.id,
    title: 'New Job Assignment',
    message: `You have been assigned to booking ${booking.booking_reference}. Please review and accept.`,
    type: 'assignment',
  });
  await addNotification(connection, {
    userId: booking.customer_id,
    bookingId: booking.id,
    title: 'Technician Assigned',
    message: `A technician has been assigned to your booking ${booking.booking_reference}.`,
    type: 'assignment',
  });
  await addAuditLog(connection, {
    userId: payload.admin_id,
    action: 'TECHNICIAN_ASSIGNED',
    module: 'DISPATCH',
    recordId: booking.id,
    description: `Technician (user_id: ${technicianUserId}) assigned to booking ${booking.booking_reference}`,
    ipAddress: payload.ip_address,
  });
};

const handleStatusChanged = async (connection, payload) => {
  const { booking, new_status: newStatus } = payload;
  const notification = statusNotifications[newStatus];
  if (notification) {
    await addNotification(connection, {
      userId: booking.customer_id,
      bookingId: booking.id,
      title: notification.title,
      message: notification.message(booking.booking_reference),
      type: 'status_update',
    });
  }
  await addAuditLog(connection, {
    userId: payload.changed_by,
    action: 'STATUS_CHANGED',
    module: 'BOOKING',
    recordId: booking.id,
    description: `Booking ${booking.booking_reference} status changed from ${payload.old_status} to ${newStatus}`,
    ipAddress: payload.ip_address,
  });
};

const handleAccepted = async (connection, payload) => {
  const { booking, technician_id: technicianId, technician_name: technicianName } = payload;
  await addNotification(connection, {
    userId: booking.customer_id,
    bookingId: booking.id,
    title: 'Technician Accepted Your Booking',
    message: `Good news! Technician ${technicianName} has accepted your booking ${booking.booking_reference} for ${booking.service_name}. They will be on their way soon.`,
    type: 'status_update',
  });
  await addNotification(connection, {
    userId: technicianId,
    bookingId: booking.id,
    title: 'You Accepted a Job',
    message: `You have accepted booking ${booking.booking_reference} (${booking.service_name}). Please proceed to the customer location.`,
    type: 'status_update',
  });
  await notifyAdmins(connection, {
    bookingId: booking.id,
    title: 'Technician Accepted a Job',
    message: `Technician ${technicianName} accepted booking ${booking.booking_reference} (${booking.service_name}).`,
    type: 'status_update',
  });
  await addAuditLog(connection, {
    userId: technicianId,
    action: 'JOB_ACCEPTED',
    module: 'BOOKING',
    recordId: booking.id,
    description: `Technician ${technicianName} accepted booking ${booking.booking_reference} (${booking.service_name}). Customer and admin notified.`,
    ipAddress: payload.ip_address,
  });
};

const handleRejected = async (connection, payload) => {
  const { booking, technician_id: technicianId, technician_name: technicianName } = payload;
  await addNotification(connection, {
    userId: booking.customer_id,
    bookingId: booking.id,
    title: 'Job Rejected by Technician',
    message: `Sorry, technician ${technicianName} has rejected your booking ${booking.booking_reference} for ${booking.service_name}. Our team will reassign another technician shortly.`,
    type: 'status_update',
  });
  await addNotification(connection, {
    userId: technicianId,
    bookingId: booking.id,
    title: 'You Rejected a Job',
    message: `You have rejected booking ${booking.booking_reference} (${booking.service_name}). Your availability has been reset to available.`,
    type: 'status_update',
  });
  await notifyAdmins(connection, {
    bookingId: booking.id,
    title: 'Technician Rejected a Job',
    message: `Technician ${technicianName} rejected booking ${booking.booking_reference} (${booking.service_name}). Please reassign a technician.`,
    type: 'rejection',
  });
  await addAuditLog(connection, {
    userId: technicianId,
    action: 'JOB_REJECTED',
    module: 'BOOKING',
    recordId: booking.id,
    description: `Technician ${technicianName} rejected booking ${booking.booking_reference} (${booking.service_name}). Booking reset to Pending for reassignment.`,
    ipAddress: payload.ip_address,
  });
};

const handleCompleted = async (connection, payload) => {
  const { booking } = payload;
  await addNotification(connection, {
    userId: booking.customer_id,
    bookingId: booking.id,
    title: 'Service Completed & Invoice Ready',
    message: `Your service is complete. Invoice ${payload.invoice_number} has been generated. Total: ₱${Number(payload.total).toFixed(2)}`,
    type: 'completion',
  });
  await addAuditLog(connection, {
    userId: payload.technician_id,
    action: 'SERVICE_COMPLETED',
    module: 'BOOKING',
    recordId: booking.id,
    description: `Service completed for booking ${booking.booking_reference}. Invoice ${payload.invoice_number} generated.`,
    ipAddress: payload.ip_address,
  });
  await addAuditLog(connection, {
    userId: payload.technician_id,
    action: 'INVOICE_CREATED',
    module: 'BILLING',
    recordId: booking.id,
    description: `Invoice ${payload.invoice_number} created for booking ${booking.booking_reference}. Total: ${Number(payload.total).toFixed(2)}`,
    ipAddress: payload.ip_address,
  });
};

const handlers = {
  'booking.created': handleBookingCreated,
  'booking.technician_assigned': handleTechnicianAssigned,
  'booking.status_changed': handleStatusChanged,
  'booking.accepted': handleAccepted,
  'booking.rejected': handleRejected,
  'booking.completed': handleCompleted,
};

const processBookingEvent = async (connection, event) => {
  if (!event || !event.event_id || !event.event_type || !event.payload) {
    throw new Error('Invalid booking event envelope.');
  }
  if (event.schema_version !== 1) {
    throw new Error(`Unsupported booking event schema version: ${event.schema_version}`);
  }
  const handler = handlers[event.event_type];
  if (!handler) throw new Error(`Unsupported booking event type: ${event.event_type}`);

  await connection.beginTransaction();
  try {
    const [processed] = await connection.execute(
      'SELECT event_id FROM event_inbox WHERE event_id = ? FOR UPDATE',
      [event.event_id]
    );
    if (processed.length) {
      await connection.commit();
      return false;
    }
    await handler(connection, event.payload);
    await connection.execute('INSERT INTO event_inbox (event_id) VALUES (?)', [event.event_id]);
    await connection.commit();
    return true;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Booking event transaction rollback failed:', rollbackError.message);
    }
    throw error;
  }
};

module.exports = { processBookingEvent };
