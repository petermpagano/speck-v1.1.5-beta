// Simple API proxy for Anthropic API calls
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model, temperature, max_tokens, stream } = req.body;
  
  // Get API key from environment
  const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        system: systemMessage,
        messages: conversationMessages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1000,
        stream: stream || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json(error);
    }

    // If streaming, forward the stream
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        res.write(chunk);
      }
      
      res.end();
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
