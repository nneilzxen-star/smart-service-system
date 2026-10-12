jest.mock('../utils/db', () => ({
  pool: { getConnection: jest.fn() },
}));

const { pool } = require('../utils/db');
const { createBooking } = require('../controllers/bookingController');

const createRequest = () => ({
  body: {
    service_id: 3,
    booking_date: '2099-10-20',
    booking_time: '10:00',
    service_address: '123 Test Street',
    description: 'Test booking',
  },
  user: { id: 7, role: 'customer' },
  ip: '127.0.0.1',
});

const createResponse = () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
};

describe('createBooking transactional outbox', () => {
  let connection;

  beforeEach(() => {
    connection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
      execute: jest.fn(async (sql) => {
        if (sql.startsWith('SELECT * FROM services')) {
          return [[{ id: 3, name: 'Test service', base_price: '250.00' }]];
        }
        if (sql.startsWith('INSERT INTO bookings')) return [{ insertId: 42 }];
        return [{ affectedRows: 1 }];
      }),
    };
    pool.getConnection.mockReset().mockResolvedValue(connection);
  });

  test('commits booking, initial history, and event in the same transaction', async () => {
    const response = createResponse();

    await createBooking(createRequest(), response);

    expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.execute.mock.calls.map(([sql]) => sql)).toEqual(expect.arrayContaining([
      expect.stringContaining('INSERT INTO bookings'),
      expect.stringContaining('INSERT INTO booking_status_history'),
      expect.stringContaining('INSERT INTO outbox_events'),
    ]));
    expect(response.status).toHaveBeenCalledWith(201);
  });

  test('rolls booking writes back when recording the outbox event fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    connection.execute.mockImplementation(async (sql) => {
      if (sql.startsWith('SELECT * FROM services')) {
        return [[{ id: 3, name: 'Test service', base_price: '250.00' }]];
      }
      if (sql.startsWith('INSERT INTO bookings')) return [{ insertId: 42 }];
      if (sql.startsWith('INSERT INTO outbox_events')) throw new Error('outbox unavailable');
      return [{ affectedRows: 1 }];
    });
    const response = createResponse();

    await createBooking(createRequest(), response);

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(500);
    consoleError.mockRestore();
  });
});
