jest.mock('../utils/db', () => ({
  pool: { getConnection: jest.fn() },
}));

const { pool } = require('../utils/db');
const { withTransaction } = require('../utils/transaction');

describe('withTransaction', () => {
  let connection;

  beforeEach(() => {
    connection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
    };
    pool.getConnection.mockReset().mockResolvedValue(connection);
  });

  test('commits successful operations and releases the connection', async () => {
    const result = await withTransaction(async () => 'saved');

    expect(result).toBe('saved');
    expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test('rolls back failed operations and preserves the original error', async () => {
    const operationError = new Error('write failed');

    await expect(withTransaction(async () => { throw operationError; })).rejects.toBe(operationError);

    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });
});
