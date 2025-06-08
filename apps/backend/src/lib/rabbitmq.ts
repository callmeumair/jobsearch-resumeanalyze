import amqp, { Connection, Channel } from 'amqplib';
import { connectDB } from './mongodb';
import { ResumeModel } from '../models/Resume';
import { log } from './logger';

const EXCHANGE_NAME = 'resume_processing';
const QUEUE_NAME = 'resume_parse_queue';
const ROUTING_KEY = 'resume.parse';

let connection: Connection | null = null;
let channel: Channel | null = null;

export const connect = async () => {
  try {
    if (!process.env.RABBITMQ_URL) {
      throw new Error('RABBITMQ_URL is not defined');
    }

    connection = await amqp.connect(process.env.RABBITMQ_URL);
    if (!connection) {
      throw new Error('Failed to create RabbitMQ connection');
    }

    channel = await connection.createChannel();
    if (!channel) {
      throw new Error('Failed to create RabbitMQ channel');
    }

    // Set up exchange
    await channel.assertExchange(EXCHANGE_NAME, 'direct', {
      durable: true,
    });

    // Set up queue
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-message-ttl': 24 * 60 * 60 * 1000, // 24 hours
      },
    });

    // Bind queue to exchange
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    // Handle connection events
    if (connection) {
      connection.on('error', (err) => {
        log.error('RabbitMQ connection error', err);
        connection = null;
        channel = null;
      });

      connection.on('close', () => {
        log.warn('RabbitMQ connection closed');
        connection = null;
        channel = null;
      });
    }

    log.info('Connected to RabbitMQ');
    return { connection, channel };
  } catch (error) {
    log.error('Failed to connect to RabbitMQ', error as Error);
    throw error;
  }
};

export const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
};

export const close = async () => {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    log.info('RabbitMQ connection closed');
  } catch (error) {
    log.error('Error closing RabbitMQ connection', error as Error);
    throw error;
  }
};

export const publishResumeJob = async (
  userId: string,
  resumeId: string,
  bucket: string,
  key: string
) => {
  try {
    const { channel } = await connect();
    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const message = {
      userId,
      resumeId,
      bucket,
      key,
      timestamp: new Date().toISOString(),
    };

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEY,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
        contentType: 'application/json',
      }
    );

    console.log('Published resume job:', message);
  } catch (error) {
    console.error('Failed to publish resume job:', error);
    throw error;
  }
};

export const startResumeConsumer = async () => {
  try {
    const { channel } = await connect();
    if (!channel) {
      throw new Error('RabbitMQ channel not available');
    }

    // Set prefetch to 1 to process one job at a time
    await channel.prefetch(1);

    console.log('Starting resume consumer...');

    channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) {
        return;
      }

      try {
        const message = JSON.parse(msg.content.toString());
        console.log('Processing resume job:', message);

        // Process the resume (this will be handled by the Lambda function)
        // We're just acknowledging the message here
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing resume job:', error);
        // Reject the message and requeue
        channel.nack(msg, false, true);
      }
    });
  } catch (error) {
    console.error('Failed to start resume consumer:', error);
    throw error;
  }
};

// Example usage in a local development environment
if (process.env.NODE_ENV === 'development') {
  connect()
    .then(() => startResumeConsumer())
    .catch((error) => {
      console.error('Failed to start RabbitMQ consumer:', error);
      process.exit(1);
    });
} 