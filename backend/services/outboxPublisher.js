require('dotenv').config();
const amqp = require('amqplib');
const { pool } = require('../utils/db');
const {
  EXCHANGE,
  EVENT_ROUTING_KEY,
  assertBrokerTopology,
} = require('./brokerTopology');

const BATCH_SIZE = 50;
const POLL_INTERVAL_MS = 1000;
const RECONNECT_INTERVAL_MS = 5000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://smartservice:smartservice_dev_password@localhost:5672';

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const publishPendingEvents = async (channel) => {
  const [events] = await pool.execute(
    'SELECT id, aggregate_type, aggregate_id, event_type, payload, created_at FROM outbox_events WHERE published_at IS NULL ORDER BY created_at ASC LIMIT ?',
    [BATCH_SIZE]
  );

  for (const event of events) {
    const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
    const envelope = {
      event_id: event.id,
      event_type: event.event_type,
      schema_version: 1,
      aggregate_type: event.aggregate_type,
      aggregate_id: event.aggregate_id,
      occurred_at: event.created_at,
      payload,
    };

    try {
      channel.publish(EXCHANGE, EVENT_ROUTING_KEY, Buffer.from(JSON.stringify(envelope)), {
        contentType: 'application/json',
        deliveryMode: 2,
        messageId: event.id,
        type: event.event_type,
        timestamp: Date.now(),
      });
      await channel.waitForConfirms();
      await pool.execute(
        'UPDATE outbox_events SET published_at = CURRENT_TIMESTAMP, publish_attempts = publish_attempts + 1, last_error = NULL WHERE id = ? AND published_at IS NULL',
        [event.id]
      );
    } catch (error) {
      await pool.execute(
        'UPDATE outbox_events SET publish_attempts = publish_attempts + 1, last_error = ? WHERE id = ? AND published_at IS NULL',
        [String(error.message || error).slice(0, 2000), event.id]
      );
      throw error;
    }
  }

  return events.length;
};

const run = async () => {
  while (true) {
    let connection;
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      connection.on('error', (error) => console.error('RabbitMQ publisher connection error:', error.message));
      const channel = await connection.createConfirmChannel();
      await assertBrokerTopology(channel);
      console.log('✅ Booking outbox publisher connected to RabbitMQ');
      let connected = true;
      connection.once('close', () => { connected = false; });

      while (connected) {
        try {
          const count = await publishPendingEvents(channel);
          if (!count) await sleep(POLL_INTERVAL_MS);
        } catch (error) {
          console.error('Outbox publish failed; events will be retried:', error.message);
          await sleep(RECONNECT_INTERVAL_MS);
          if (channel.connection.stream.destroyed) connected = false;
        }
      }
    } catch (error) {
      console.error('Outbox publisher could not connect:', error.message);
    } finally {
      if (connection) await connection.close().catch(() => {});
    }
    await sleep(RECONNECT_INTERVAL_MS);
  }
};

if (require.main === module) {
  run().catch((error) => {
    console.error('Outbox publisher stopped unexpectedly:', error);
    process.exitCode = 1;
  });
}

module.exports = { publishPendingEvents };
