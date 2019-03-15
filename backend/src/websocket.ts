import * as socketio from 'socket.io';
import { EventEmitter2 } from 'eventemitter2';
import { log } from 'fzi-iota-showcase-client';

export default function startWebsocket(events: EventEmitter2) {
  const io = socketio();
  io.on('connection', (client: SocketIO.Socket) => {
    log.info('Connected to websocket client.');
    events.onAny((event: any, data: any) => client.emit(event, data));
    client.on('start', () => {
      events.emit('start');
    });
  });
  io.listen(3000);
  log.info('Listening on port 3000');
}
