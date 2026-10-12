const { pool } = require('./db');

const withTransaction = async (operation) => {
  const connection = await pool.getConnection();
  let started = false;
  try {
    await connection.beginTransaction();
    started = true;
    const result = await operation(connection);
    await connection.commit();
    started = false;
    return result;
  } catch (error) {
    if (started) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Transaction rollback failed:', rollbackError.message);
      }
    }
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { withTransaction };
