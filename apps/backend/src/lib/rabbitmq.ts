import amqp from 'amqplib';
import { connectDB } from './mongodb';
import { ResumeModel } from '../models/Resume';

const EXCHANGE_NAME = 'resume_parser';
const QUEUE_NAME = 'resume_parse_jobs';
const ROUTING_KEY = 'parse.resume';

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export const connectRabbitMQ = async () => {
  if (connection) {
    return { connection, channel };
  }

  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL!);
    channel = await connection.createChannel();

    // Create exchange
    await channel.assertExchange(EXCHANGE_NAME, 'direct', {
      durable: true,
    });

    // Create queue
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    // Bind queue to exchange
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
      connection = null;
      channel = null;
    });

    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });

    return { connection, channel };
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
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
    const { channel } = await connectRabbitMQ();
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
    const { channel } = await connectRabbitMQ();
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
  connectRabbitMQ()
    .then(() => startResumeConsumer())
    .catch((error) => {
      console.error('Failed to start RabbitMQ consumer:', error);
      process.exit(1);
    });
} 