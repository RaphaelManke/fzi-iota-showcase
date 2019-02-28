import * as socketio from 'socket.io';

(async () => {
  const io = socketio();
  io.on('connection', (client: SocketIO.Socket) => {
    console.log('Connected to websocket client.');
  });
  io.listen(3000);
  console.log('Listening on port 3000');
})();
