const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 3001);
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']]
]);

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = files.get(pathname);
  if (req.method !== 'GET' || !file) {
    res.writeHead(404, {'content-type':'text/plain; charset=utf-8'});
    return res.end('Not found.');
  }
  try {
    const content = await fs.readFile(path.join(root, file[0]));
    res.writeHead(200, {'content-type':file[1], 'content-length':content.length});
    res.end(content);
  } catch {
    res.writeHead(500, {'content-type':'text/plain; charset=utf-8'});
    res.end('Could not load the app.');
  }
});

server.listen(port, '127.0.0.1', () => console.log(`Insur Market running at http://127.0.0.1:${port}`));
