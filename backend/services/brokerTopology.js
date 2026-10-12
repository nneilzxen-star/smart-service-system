const EXCHANGE = 'smartservice.events';
const EVENT_QUEUE = 'smartservice.booking-events';
const RETRY_QUEUE = 'smartservice.booking-events.retry';
const DEAD_QUEUE = 'smartservice.booking-events.dead';
const EVENT_ROUTING_KEY = 'booking.event';
const DEAD_ROUTING_KEY = 'booking.dead';
const RETRY_DELAY_MS = 5000;

const assertBrokerTopology = async (channel) => {
  await channel.assertExchange(EXCHANGE, 'direct', { durable: true });
  await channel.assertQueue(EVENT_QUEUE, {
    durable: true,
    deadLetterExchange: EXCHANGE,
    deadLetterRoutingKey: DEAD_ROUTING_KEY,
  });
  await channel.bindQueue(EVENT_QUEUE, EXCHANGE, EVENT_ROUTING_KEY);
  await channel.assertQueue(RETRY_QUEUE, {
    durable: true,
    messageTtl: RETRY_DELAY_MS,
    deadLetterExchange: EXCHANGE,
    deadLetterRoutingKey: EVENT_ROUTING_KEY,
    arguments: {
      'x-queue-type': 'quorum',
      'x-dead-letter-strategy': 'at-least-once',
      'x-overflow': 'reject-publish',
    },
  });
  await channel.bindQueue(RETRY_QUEUE, EXCHANGE, RETRY_QUEUE);
  await channel.assertQueue(DEAD_QUEUE, { durable: true });
  await channel.bindQueue(DEAD_QUEUE, EXCHANGE, DEAD_ROUTING_KEY);
};

module.exports = {
  EXCHANGE,
  EVENT_QUEUE,
  RETRY_QUEUE,
  DEAD_QUEUE,
  EVENT_ROUTING_KEY,
  DEAD_ROUTING_KEY,
  assertBrokerTopology,
};
