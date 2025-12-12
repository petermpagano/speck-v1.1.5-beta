import http from 'http';
import https from 'https';

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/chat') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { messages, model, temperature, max_tokens, stream } = JSON.parse(body);
      
      const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey || apiKey === 'your-api-key-here') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'API key not configured. Copy .env.example to .env and add your Anthropic API key.' } }));
        return;
      }

      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const conversationMessages = messages.filter(m => m.role !== 'system');

      const requestBody = JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        system: systemMessage,
        messages: conversationMessages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1000,
        stream: stream || false,
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(requestBody),
        },
      };

      const proxyReq = https.request(options, (proxyRes) => {
        if (stream) {
          res.writeHead(proxyRes.statusCode, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          });
          proxyRes.pipe(res);
        } else {
          let data = '';
          proxyRes.on('data', chunk => data += chunk);
          proxyRes.on('end', () => {
            res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
          });
        }
      });

      proxyReq.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: err.message } }));
      });

      proxyReq.write(requestBody);
      proxyReq.end();
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: err.message } }));
    }
  });
});

server.listen(PORT, () => {
  console.log('Speck Agent API proxy running at http://localhost:' + PORT);
  console.log('Ready to relay requests to Anthropic API');
});
