const { processBookingEvent } = require('../services/bookingEventHandler');

const createConnection = ({ alreadyProcessed = false, failOnNotification = false } = {}) => {
  const statements = [];
  return {
    statements,
    beginTransaction: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    execute: jest.fn(async (sql, params) => {
      statements.push({ sql, params });
      if (sql.startsWith('SELECT event_id FROM event_inbox')) {
        return [alreadyProcessed ? [{ event_id: params[0] }] : []];
      }
      if (sql.startsWith('SELECT id FROM users')) return [[{ id: 10 }, { id: 11 }]];
      if (failOnNotification && sql.startsWith('INSERT INTO notifications')) {
        throw new Error('notification insert failed');
      }
      return [{ affectedRows: 1 }];
    }),
  };
};

const bookingCreatedEvent = {
  event_id: 'f29e5b2a-0f23-48e5-8b9f-1b0bd2b4b1d5',
  event_type: 'booking.created',
  schema_version: 1,
  payload: {
    booking: {
      id: 5,
      booking_reference: 'SB-20261009-1234',
      customer_id: 2,
      service_name: 'Air Conditioner Repair',
    },
    user_id: 2,
    ip_address: '127.0.0.1',
  },
};

describe('processBookingEvent', () => {
  test('persists notifications, audit data, and inbox receipt in one transaction', async () => {
    const connection = createConnection();

    const processed = await processBookingEvent(connection, bookingCreatedEvent);

    expect(processed).toBe(true);
    expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.statements.filter(({ sql }) => sql.startsWith('INSERT INTO notifications'))).toHaveLength(2);
    expect(connection.statements.some(({ sql }) => sql.startsWith('INSERT INTO audit_logs'))).toBe(true);
    expect(connection.statements.some(({ sql }) => sql.startsWith('INSERT INTO event_inbox'))).toBe(true);
  });

  test('does not repeat side effects for an event already in the inbox', async () => {
    const connection = createConnection({ alreadyProcessed: true });

    const processed = await processBookingEvent(connection, bookingCreatedEvent);

    expect(processed).toBe(false);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.statements).toHaveLength(1);
  });

  test('rolls back side effects and leaves the event retryable on database failure', async () => {
    const connection = createConnection({ failOnNotification: true });

    await expect(processBookingEvent(connection, bookingCreatedEvent)).rejects.toThrow('notification insert failed');

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.statements.some(({ sql }) => sql.startsWith('INSERT INTO event_inbox'))).toBe(false);
  });

  test('rejects unsupported event types so the worker can retry or dead-letter them', async () => {
    const connection = createConnection();

    await expect(processBookingEvent(connection, {
      ...bookingCreatedEvent,
      event_type: 'booking.unrecognized',
    })).rejects.toThrow('Unsupported booking event type: booking.unrecognized');

    expect(connection.beginTransaction).not.toHaveBeenCalled();
    expect(connection.commit).not.toHaveBeenCalled();
  });

  test('rejects event schema versions the worker does not understand', async () => {
    const connection = createConnection();

    await expect(processBookingEvent(connection, {
      ...bookingCreatedEvent,
      schema_version: 2,
    })).rejects.toThrow('Unsupported booking event schema version: 2');

    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });
});
