import * as socketio from 'socket.io';
import { EventEmitter2 } from 'eventemitter2';

export default function startWebsocket(events: EventEmitter2) {
  const io = socketio();
  io.on('connection', (client: SocketIO.Socket) => {
    console.log('Connected to websocket client.');
    events.onAny((event: any, data: any) => client.emit(event, data));
    client.on('start', () => {
      events.emit('start');
    });
  });
  io.listen(3000);
  console.log('Listening on port 3000');
}

