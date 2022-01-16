import { ClientRequest, IncomingMessage, ServerResponse } from 'http';
import httpProxy from 'http-proxy';

let CACHE: any = {};

const PORT = 5000;

const options: httpProxy.ServerOptions = {
  target: 'http://127.0.0.1:5001',
};

const proxy = httpProxy.createProxyServer(options);

proxy.listen(PORT);

proxy.on('error', (err, req, res) => {
  console.log('ERORR::', err);
  res.writeHead(500, {
    'Content-Type': 'text/plain',
  });

  res.end('Something went wrong. And we are reporting a custom error message.');
});

proxy.on(
  'proxyRes',
  (proxyRes: any, req: IncomingMessage, res: ServerResponse) => {
    setCache(proxyRes, req, res);
    console.log(2);
  },
);

proxy.on(
  'proxyReq',
  (proxyReq: any, req: IncomingMessage, res: ServerResponse) => {
    //useCache(proxyReq, req, res);
    console.log(1);
  },
);

function setCache(
  proxyRes: IncomingMessage,
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!req.url || req.method !== 'GET') {
    return;
  }

  const chunks: any[] = [];

  proxyRes.on('data', (chunk: any) => {
    chunks.push(chunk);
  });

  proxyRes.on('end', () => {
    CACHE[req.url as string] = chunks;
  });
}

function useCache(
  proxyReq: ClientRequest,
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.method !== 'GET') {
    return;
  }

  if (req.url && req.url in CACHE) {
    proxyReq.destroy();

    res.writeHead(200, {
      'Content-Type': 'application/json',
    });

    for (const chunk of CACHE[req.url]) {
      res.write(chunk);
    }

    res.end();
    res.destroy();
  }
}

setInterval(() => {
  CACHE = {};
}, 10 * 1000);
