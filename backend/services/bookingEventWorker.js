require('dotenv').config();
const amqp = require('amqplib');
const { pool } = require('../utils/db');
const { processBookingEvent } = require('./bookingEventHandler');
const {
  EVENT_QUEUE,
  RETRY_QUEUE,
  EXCHANGE,
  DEAD_ROUTING_KEY,
  assertBrokerTopology,
} = require('./brokerTopology');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://smartservice:smartservice_dev_password@localhost:5672';
const MAX_RETRIES = 5;
const RECONNECT_INTERVAL_MS = 5000;
const PREFETCH_COUNT = 10;

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const publishAndConfirm = async (channel, routingKey, message, options) => {
  channel.publish(EXCHANGE, routingKey, message, options);
  await channel.waitForConfirms();
};

const startConsumer = async (connection) => {
  const channel = await connection.createChannel();
  const publisher = await connection.createConfirmChannel();
  await assertBrokerTopology(channel);
  await assertBrokerTopology(publisher);
  await channel.prefetch(PREFETCH_COUNT);

  await channel.consume(EVENT_QUEUE, (message) => {
    if (!message) return;
    void (async () => {
      try {
        const event = JSON.parse(message.content.toString());
        const dbConnection = await pool.getConnection();
        try {
          await processBookingEvent(dbConnection, event);
        } finally {
          dbConnection.release();
        }
        channel.ack(message);
      } catch (error) {
        const headers = message.properties.headers || {};
        const retryCount = Number(headers['x-retry-count'] || 0);
        const retrying = retryCount < MAX_RETRIES;
        const routingKey = retrying ? RETRY_QUEUE : DEAD_ROUTING_KEY;
        const nextHeaders = { ...headers };
        if (retrying) nextHeaders['x-retry-count'] = retryCount + 1;

        try {
          await publishAndConfirm(publisher, routingKey, message.content, {
            contentType: message.properties.contentType || 'application/json',
            deliveryMode: 2,
            messageId: message.properties.messageId,
            type: message.properties.type,
            headers: nextHeaders,
          });
          if (retrying) {
            console.error(`Booking event failed; queued retry ${retryCount + 1}/${MAX_RETRIES}:`, error.message);
          } else {
            console.error('Booking event moved to dead-letter queue after retries:', error.message);
          }
          channel.ack(message);
        } catch (publishError) {
          console.error('Could not route failed event; returning it to the queue:', publishError.message);
          channel.nack(message, false, true);
        }
      }
    })();
  }, { noAck: false });

  console.log('✅ Booking event worker consuming RabbitMQ events');
  return { channel, publisher };
};

const run = async () => {
  while (true) {
    let connection;
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      connection.on('error', (error) => console.error('RabbitMQ worker connection error:', error.message));
      const { channel, publisher } = await startConsumer(connection);
      await new Promise((resolve) => connection.once('close', resolve));
      await Promise.all([channel.close().catch(() => {}), publisher.close().catch(() => {})]);
    } catch (error) {
      console.error('Booking event worker could not connect:', error.message);
      if (connection) await connection.close().catch(() => {});
    }
    await sleep(RECONNECT_INTERVAL_MS);
  }
};

if (require.main === module) {
  run().catch((error) => {
    console.error('Booking event worker stopped unexpectedly:', error);
    process.exitCode = 1;
  });
}

module.exports = { startConsumer };
