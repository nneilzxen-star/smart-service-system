process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters';

jest.mock('../utils/db', () => ({
  pool: { execute: jest.fn() },
}));

const jwt = require('jsonwebtoken');
const { pool } = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe('JWT authentication middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 401 for an invalid token without querying the database', async () => {
    const res = response();

    await authenticate({ headers: { authorization: 'Bearer invalid' } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(pool.execute).not.toHaveBeenCalled();
  });

  test('passes database failures to the application error handler instead of logging out the user', async () => {
    const databaseError = new Error('database unavailable');
    pool.execute.mockRejectedValueOnce(databaseError);
    const next = jest.fn();

    await authenticate({
      headers: { authorization: `Bearer ${jwt.sign({ id: 7 }, process.env.JWT_SECRET)}` },
    }, response(), next);

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});
