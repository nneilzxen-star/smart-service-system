const { assertBrokerTopology } = require('../services/brokerTopology');

test('declares durable event, retry, and dead-letter routes', async () => {
  const channel = {
    assertExchange: jest.fn().mockResolvedValue(),
    assertQueue: jest.fn().mockResolvedValue(),
    bindQueue: jest.fn().mockResolvedValue(),
  };

  await assertBrokerTopology(channel);

  expect(channel.assertExchange).toHaveBeenCalledWith('smartservice.events', 'direct', { durable: true });
  expect(channel.assertQueue).toHaveBeenCalledWith(
    'smartservice.booking-events',
    expect.objectContaining({ durable: true, deadLetterRoutingKey: 'booking.dead' })
  );
  expect(channel.assertQueue).toHaveBeenCalledWith(
    'smartservice.booking-events.retry',
    expect.objectContaining({
      durable: true,
      messageTtl: 5000,
      deadLetterExchange: 'smartservice.events',
      deadLetterRoutingKey: 'booking.event',
      arguments: {
        'x-queue-type': 'quorum',
        'x-dead-letter-strategy': 'at-least-once',
        'x-overflow': 'reject-publish',
      },
    })
  );
  expect(channel.bindQueue).toHaveBeenCalledWith(
    'smartservice.booking-events.retry',
    'smartservice.events',
    'smartservice.booking-events.retry'
  );
  expect(channel.bindQueue).toHaveBeenCalledWith(
    'smartservice.booking-events.dead',
    'smartservice.events',
    'booking.dead'
  );
});
