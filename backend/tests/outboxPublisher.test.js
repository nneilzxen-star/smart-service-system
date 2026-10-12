jest.mock('../utils/db', () => ({
  pool: { execute: jest.fn() },
}));

const { pool } = require('../utils/db');
const { publishPendingEvents } = require('../services/outboxPublisher');

describe('publishPendingEvents', () => {
  const outboxRecord = {
    id: 'b97c4f97-1a38-44cc-90e8-8f813b31f5af',
    aggregate_type: 'booking',
    aggregate_id: 42,
    event_type: 'booking.created',
    payload: { booking: { id: 42 } },
    created_at: new Date('2026-10-09T10:00:00Z'),
  };

  beforeEach(() => pool.execute.mockReset());

  test('publishes a durable event and marks it published after broker confirmation', async () => {
    pool.execute
      .mockResolvedValueOnce([[outboxRecord]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const channel = {
      publish: jest.fn(),
      waitForConfirms: jest.fn().mockResolvedValue(),
    };

    const count = await publishPendingEvents(channel);

    expect(count).toBe(1);
    expect(channel.publish).toHaveBeenCalledWith(
      'smartservice.events',
      'booking.event',
      expect.any(Buffer),
      expect.objectContaining({ deliveryMode: 2, messageId: outboxRecord.id })
    );
    const publishedEnvelope = JSON.parse(channel.publish.mock.calls[0][2].toString());
    expect(publishedEnvelope).toMatchObject({
      event_id: outboxRecord.id,
      event_type: 'booking.created',
      schema_version: 1,
      aggregate_type: 'booking',
      aggregate_id: 42,
      payload: { booking: { id: 42 } },
    });
    expect(channel.waitForConfirms).toHaveBeenCalledTimes(1);
    expect(pool.execute.mock.calls[1][0]).toContain('SET published_at = CURRENT_TIMESTAMP');
    expect(pool.execute.mock.calls[1][1]).toEqual([outboxRecord.id]);
  });

  test('records a publish failure and leaves the event available for retry', async () => {
    pool.execute
      .mockResolvedValueOnce([[outboxRecord]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const channel = {
      publish: jest.fn(),
      waitForConfirms: jest.fn().mockRejectedValue(new Error('broker unavailable')),
    };

    await expect(publishPendingEvents(channel)).rejects.toThrow('broker unavailable');

    expect(pool.execute.mock.calls[1][0]).toContain('last_error = ?');
    expect(pool.execute.mock.calls[1][1]).toEqual(['broker unavailable', outboxRecord.id]);
  });
});
