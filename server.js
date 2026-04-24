import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const app = express();
app.use(cors());

const transports = new Map();

app.get('/sse', async (req, res) => {
  const sessionId = Math.random().toString(36).substring(7);
  console.log(`[New Connection] Session: ${sessionId}`);
  
  const transport = new SSEServerTransport('/message?sessionId=' + sessionId, res);
  await transport.start();
  transports.set(sessionId, transport);

  // Start the local Context Hub CLI silently 
  const chubProcess = spawn('npm', ['start', '--silent'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: process.env
  });

  // Catch the output from Context Hub and send it to your Web AI
  let buffer = '';
  chubProcess.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; 
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          transport.send(message);
        } catch (e) {
          // Ignore background terminal noise
        }
      }
    }
  });

  // Catch messages from your Web AI and send them into Context Hub
  transport.onmessage = (message) => {
    chubProcess.stdin.write(JSON.stringify(message) + '\n');
  };

  req.on('close', () => {
    console.log(`[Connection Closed] Session: ${sessionId}`);
    transports.delete(sessionId);
    chubProcess.kill();
  });
});

app.post('/message', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).send('Session not found');
    return;
  }
  await transport.handlePostMessage(req, res);
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Context Hub SSE Bridge running on port ${port}`);
});
