const messagesArea = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const statusDisplay = document.getElementById('status');
const userCount = document.getElementById('userCount');

let ws;

function connect() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

  ws.onopen = function () {
    statusDisplay.querySelector('div').textContent = 'Connected';
    statusDisplay.className = 'status connected';
  };

  ws.onclose = function () {
    statusDisplay.querySelector('div').textContent = 'Disconnected';
    statusDisplay.className = 'status disconnected';
    // Reconnect after 3 seconds
    setTimeout(connect, 3000);
  };

  ws.onerror = function () {
    statusDisplay.querySelector('div').textContent = 'Connection Error';
    statusDisplay.className = 'status disconnected';
  };

  ws.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (data.type === 'message') {
      if (messagesArea.value) {
        messagesArea.value += '\n' + data.message;
      } else {
        messagesArea.value = data.message;
      }
      messagesArea.scrollTop = messagesArea.scrollHeight;
    } else if (data.type === 'clear') {
      messagesArea.value = '';
    } else if (data.type === 'history') {
      messagesArea.value = data.messages.join('\n');
      messagesArea.scrollTop = messagesArea.scrollHeight;
    } else if (data.type === 'userCount') {
      userCount.textContent = `Users online: ${data.count}`;
    }
  };
}

messageInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter' && messageInput.value.trim()) {
    const message = messageInput.value.trim();

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        message: message
      }));
      messageInput.value = '';
    }
  }
});

// Start connection
connect();
