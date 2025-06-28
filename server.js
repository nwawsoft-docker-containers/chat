const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Load environment variables from .env file
const CHAT_SESSION_SECRET = process.env.CHAT_SESSION_SECRET;
const CHAT_AUTH_PW = process.env.CHAT_AUTH_PW;
const CHAT_PORT = process.env.CHAT_PORT;

// Session middleware
app.use(session({
  secret: CHAT_SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using HTTPS
}));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Password protection middleware
const requireAuth = (req, res, next) => {
  // Allow access to login page and its assets
  if (req.path === '/login.html' || req.path === '/login-style.css' || req.path === '/login-script.js') {
    return next();
  }
  
  // Handle POST to /login separately
  if (req.path === '/login' && req.method === 'POST') {
    return next();
  }
  
  if (req.session.authenticated) {
    next();
  } else {
    // Redirect to login page for all other routes
    res.redirect('/login.html');
  }
};

// Apply authentication middleware first
app.use(requireAuth);

// Then serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Login route - handle POST request
app.post('/login', (req, res) => {
  if (req.body.password === CHAT_AUTH_PW) {
    req.session.authenticated = true;
    res.redirect('/index.html');  // Redirect to the main chat page
  } else {
    res.redirect('/login.html?error=1');
  }
});

// Root route - redirect to index.html if authenticated
app.get('/', (req, res) => {
  if (req.session.authenticated) {
    res.redirect('/index.html');
  } else {
    res.redirect('/login.html');
  }
});

// Instructional message for purging
const PURGE_INSTRUCTION = 'You can purge the entire chat by sending the message "/purge".';

// In-memory message storage (no persistence)
let messages = [PURGE_INSTRUCTION];
let connectedUsers = 0;

// Function to broadcast user count to all clients
function broadcastUserCount() {
  console.log(`Broadcasting user count: ${connectedUsers}`);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'userCount',
        count: connectedUsers
      }));
    }
  });
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  connectedUsers++;
  broadcastUserCount();

  // Send message history to new client
  ws.send(JSON.stringify({
    type: 'history',
    messages: messages
  }));

  ws.on('message', (data) => {
    try {
      const parsedData = JSON.parse(data);

      if (parsedData.type === 'message') {
        const message = parsedData.message.trim();

        // Check for clear commands
        if (message === '/clear' || message === '/purge') {
          messages = [PURGE_INSTRUCTION];
          // Broadcast clear command to all clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'clear'
              }));
              // Immediately send the instructional message as the new first message
              client.send(JSON.stringify({
                type: 'message',
                message: PURGE_INSTRUCTION
              }));
            }
          });
        } else {
          // Add message to history
          messages.push(message);

          // Broadcast message to all clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'message',
                message: message
              }));
            }
          });
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    connectedUsers--;
    broadcastUserCount();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = CHAT_PORT;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
});
