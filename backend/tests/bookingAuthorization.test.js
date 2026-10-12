let mockConnection;

jest.mock('../utils/db', () => ({
  pool: {
    execute: jest.fn(),
    getConnection: jest.fn(),
  },
}));

jest.mock('../utils/transaction', () => ({
  withTransaction: jest.fn((callback) => callback(mockConnection)),
}));

jest.mock('../events/bookingEvents', () => ({
  bookingCreated: jest.fn(),
  technicianAssigned: jest.fn(),
  statusChanged: jest.fn(),
  bookingAccepted: jest.fn(),
  bookingRejected: jest.fn(),
  serviceCompleted: jest.fn(),
}));

const { pool } = require('../utils/db');
const { createBooking, updateBooking, cancelBooking, updateStatus } = require('../controllers/bookingController');

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe('booking authorization and status transitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = { execute: jest.fn() };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('accepts a future booking time later on the current Manila date', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-09T10:00:00+08:00'));
    mockConnection.execute.mockImplementation(async (sql) => {
      if (sql.startsWith('SELECT * FROM services')) {
        return [[{ id: 3, name: 'Test service', base_price: '250.00' }]];
      }
      if (sql.startsWith('INSERT INTO bookings')) return [{ insertId: 42 }];
      return [{ affectedRows: 1 }];
    });
    const res = response();

    await createBooking({
      body: {
        service_id: 3,
        booking_date: '2026-10-09',
        booking_time: '11:00',
        service_address: 'Test address',
      },
      user: { id: 20, role: 'customer' },
      ip: '127.0.0.1',
    }, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('rejects invalid booking dates before touching the database', async () => {
    const res = response();

    await createBooking({
      body: {
        service_id: 3,
        booking_date: '2026-02-30',
        booking_time: '11:00',
        service_address: 'Test address',
      },
      user: { id: 20, role: 'customer' },
    }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockConnection.execute).not.toHaveBeenCalled();
  });

  test('does not let technicians edit a booking', async () => {
    pool.execute.mockResolvedValueOnce([[{
      id: 4,
      customer_id: 20,
      status: 'Pending',
      booking_date: '2099-10-20',
      booking_time: '10:00:00',
      service_address: 'Test address',
    }]]);
    const res = response();

    await updateBooking({ params: { id: '4' }, body: {}, user: { id: 30, role: 'technician' } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(pool.execute).toHaveBeenCalledTimes(1);
  });

  test('does not let technicians cancel another user booking', async () => {
    mockConnection.execute.mockResolvedValueOnce([[{
      id: 4,
      customer_id: 20,
      status: 'Pending',
      technician_id: null,
    }]]);
    const res = response();

    await cancelBooking({ params: { id: '4' }, user: { id: 30, role: 'technician' } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
  });

  test('does not let admins bypass valid booking status transitions', async () => {
    mockConnection.execute.mockResolvedValueOnce([[{
      id: 4,
      status: 'Pending',
      technician_id: null,
    }]]);
    const res = response();

    await updateStatus({
      params: { id: '4' },
      body: { status: 'Completed' },
      user: { id: 1, role: 'admin' },
    }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockConnection.execute).toHaveBeenCalledTimes(1);
  });
});
