class SSEManager {
  constructor() {
    this.clients = new Map();
    this.connectionCounter = 0;
    
    // Heartbeat every 30 seconds to keep connections alive
    setInterval(() => {
      this.clients.forEach(connections => {
        connections.forEach(({ res }) => {
          try {
            res.write(': ping\n\n');
          } catch (e) {
            // Ignore error
          }
        });
      });
    }, 30000);
  }

  addClient(userId, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    
    this.connectionCounter += 1;
    const connectionId = this.connectionCounter;
    
    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }
    this.clients.get(userId).push({ res, connectionId });
    
    try {
      res.write(':ok\n\n');
    } catch (e) {
      // Ignore
    }
    
    res.on('close', () => {
      this.removeClient(userId, connectionId);
    });
  }

  removeClient(userId, connectionId) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;
    
    const filtered = userClients.filter(c => c.connectionId !== connectionId);
    if (filtered.length === 0) {
      this.clients.delete(userId);
    } else {
      this.clients.set(userId, filtered);
    }
  }

  sendToUser(userId, eventName, data) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;
    
    const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    const deadConnections = [];
    
    userClients.forEach(({ res, connectionId }) => {
      try {
        res.write(message);
      } catch (e) {
        deadConnections.push(connectionId);
      }
    });
    
    deadConnections.forEach(id => this.removeClient(userId, id));
  }

  sendToUsers(userIds, eventName, data) {
    if (!Array.isArray(userIds)) return;
    userIds.forEach(userId => this.sendToUser(userId, eventName, data));
  }

  broadcast(eventName, data) {
    for (const userId of this.clients.keys()) {
      this.sendToUser(userId, eventName, data);
    }
  }

  getConnectedUserIds() {
    return Array.from(this.clients.keys());
  }
}

module.exports = new SSEManager();
