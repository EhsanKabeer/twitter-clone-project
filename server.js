/*
 * server.js
 *
 * This file runs a small microblogging server.  People can post short
 * messages and like posts.  It uses Server‑Sent Events (SSE) to send
 * updates to all connected clients.  It’s built with the core Node
 * modules and doesn’t depend on any extra packages.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// In‑memory storage for posts
let nextId = 1;
const posts = [];
const POST_HISTORY_LIMIT = 100;

// List of active SSE clients
const clients = [];

// Send periodic keep‑alive comments to all SSE clients to prevent
// proxies from closing idle connections.  Comments begin with a
// colon and are ignored by the EventSource API.  Clients that
// cannot be written to are removed from the list.
setInterval(() => {
  for (const res of clients.slice()) {
    try {
      res.write(': keep‑alive\n\n');
    } catch (err) {
      const idx = clients.indexOf(res);
      if (idx !== -1) clients.splice(idx, 1);
    }
  }
}, 15000);

/**
 * Broadcast an event to all SSE clients.
 *
 * @param {string} type Event type (e.g. 'post' or 'like')
 * @param {Object} payload Event payload
 */
function broadcast(type, payload) {
  const data = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    res.write(data);
  }
}

/**
 * Serve a static file from the client directory.
 *
 * @param {http.ServerResponse} res
 * @param {string} filePath
 */
function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

/**
 * Handle HTTP requests.
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function requestHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // SSE endpoint for real‑time updates
  if (pathname === '/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    // Send existing posts as an initial batch using custom event type
    res.write(`event: init\ndata: ${JSON.stringify(posts)}\n\n`);
    clients.push(res);
    req.on('close', () => {
      const idx = clients.indexOf(res);
      if (idx !== -1) clients.splice(idx, 1);
    });
    return;
  }

  // Get all posts
  if (pathname === '/api/posts' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(posts));
    return;
  }

  // Create a new post
  if (pathname === '/api/posts' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const authorRaw = typeof data.author === 'string' ? data.author.trim() : '';
        const contentRaw = typeof data.content === 'string' ? data.content.trim() : '';
        if (!authorRaw) throw new Error('Author is required');
        if (authorRaw.length > 50) throw new Error('Author name is too long');
        if (!contentRaw) throw new Error('Content cannot be empty');
        if (contentRaw.length > 280) throw new Error('Content exceeds 280 characters');
        const post = {
          id: nextId++,
          author: authorRaw,
          content: contentRaw,
          timestamp: Date.now(),
          likes: 0,
        };
        posts.push(post);
        // Keep history limited
        if (posts.length > POST_HISTORY_LIMIT) posts.shift();
        // Broadcast to clients
        broadcast('post', post);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, post }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Like a post
  if (pathname === '/api/like' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const postId = Number(data.id);
        if (!Number.isInteger(postId) || postId <= 0) {
          throw new Error('Invalid post id');
        }
        const post = posts.find(p => p.id === postId);
        if (!post) throw new Error('Post not found');
        post.likes += 1;
        broadcast('like', { id: post.id, likes: post.likes });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Serve static assets
  let filePath = path.join(__dirname, 'client', pathname === '/' ? 'index.html' : pathname);
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    serveStatic(res, filePath);
  });
}

const PORT = process.env.PORT || 5000;
http.createServer(requestHandler).listen(PORT, () => {
  console.log(`Twitter clone server listening on http://localhost:${PORT}`);
});