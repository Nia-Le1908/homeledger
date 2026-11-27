// Tiny static server for app/ while developing HomeLedger.
// `node serve.ts` serves app/ on port 8080 (`--port <n>` for another
// port). Development convenience only: it reads files from disk and
// sends them with the right MIME type, nothing more.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const portArg = process.argv.indexOf('--port');
const port = portArg >= 0 ? Number(process.argv[portArg + 1]) || 8080 : 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const server = createServer((req, res) => {
  let path = '/';
  try {
    path = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
    if (!path.startsWith('/')) path = '/' + path;
  } catch {
    res.writeHead(400);
    res.end('bad request');
    return;
  }
  if (path.endsWith('/')) path += 'index.html';
  const file = resolve(join(appRoot, path));
  if (file !== appRoot && !file.startsWith(appRoot + sep)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const body = readFileSync(file);
  res.writeHead(200, {
    'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
    'content-length': body.length,
    'cache-control': 'no-store',
  });
  res.end(body);
});

server.listen(port, '127.0.0.1', () => {
  console.log('HomeLedger app/ is listening on 127.0.0.1:' + port);
});
