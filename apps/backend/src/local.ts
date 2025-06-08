import { createServer } from 'http';
import { handler } from './handlers/hello';

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/hello') {
    const event = {
      httpMethod: 'GET',
      path: '/hello',
      headers: req.headers as Record<string, string>,
      queryStringParameters: {},
      body: null,
      isBase64Encoded: false,
    };

    try {
      const result = await handler(event as any);
      res.writeHead(result.statusCode, result.headers);
      res.end(result.body);
    } catch (error) {
      console.error('Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Internal server error' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Not found' }));
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Local server running at http://localhost:${PORT}`);
}); 