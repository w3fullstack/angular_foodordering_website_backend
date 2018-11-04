var client_manager = { cnt_clients: 0, clients: {} };

client_manager.broadcast = function() {
    if (this.cnt_clients) {
        for (var client in this.clients) {
            this.clients[client].send('updated');
        }
        this.log('---> Sent update message to clients');
    }
};

client_manager.addClient = function(client) {
    this.clients[client.user_id] = client;
    this.cnt_clients++;
    this.log('++++ Added a new client with user_id = ' + client.user_id + '\n     CNT_CLIENTS = ' + this.cnt_clients);
};

client_manager.disconnected = function(client) {
    var _client = this.clients[client.user_id];
    if (_client) {
        delete this.clients[client.user_id];
        this.cnt_clients--;
        this.log('---- Removed a client with user_id = ' + client.user_id + '\n     CNT_CLIENTS = ' + this.cnt_clients);
    } else {
        this.log('**** Cannot find any client with user_id = ' + client.user_id);
    }
};

client_manager.log = function(msg) {
    console.log('==== SOCKET: ' + msg);
};

module.exports = client_manager;