import express from 'express';
import cors from 'cors';
import { connectDB } from './lib/mongodb';
import { connectRabbitMQ, startResumeConsumer } from './lib/rabbitmq';
import { handler as authHandler } from './handlers/auth';
import { handler as presignedUrlHandler } from './handlers/presignedUrl';
import { handler as resumeParserHandler } from './handlers/resumeParser';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Convert Lambda handlers to Express middleware
const lambdaToExpress = (handler: any) => async (req: express.Request, res: express.Response) => {
  const event = {
    path: req.path,
    httpMethod: req.method,
    headers: req.headers,
    queryStringParameters: req.query,
    body: JSON.stringify(req.body),
  };

  try {
    const result = await handler(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Routes
app.post('/auth/register', lambdaToExpress(authHandler));
app.post('/auth/login', lambdaToExpress(authHandler));
app.post('/auth/refresh', lambdaToExpress(authHandler));

app.get('/api/resume/upload-url', lambdaToExpress(presignedUrlHandler));

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Connect to RabbitMQ and start consumer
    await connectRabbitMQ();
    await startResumeConsumer();
    console.log('Connected to RabbitMQ');

    // Start Express server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 