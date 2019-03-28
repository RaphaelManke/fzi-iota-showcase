import * as express from 'express';
import * as socketio from 'socket.io';
import * as http from 'http';
import { log } from 'fzi-iota-showcase-client';
import { SafeEmitter } from './events';
import { EnvironmentInfo } from './envInfo';

export class Server {
  private io: SocketIO.Server;
  private app: express.Application;
  private server: http.Server;

  constructor(private events: SafeEmitter, private readonly info: EnvironmentInfo) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketio(this.server);
  }

  public listen() {
    this.io.on('connection', (client: SocketIO.Socket) => {
      log.info('Connected to websocket client.');
      this.events.onAny((event: any, data: any) => {
        if (event[0] === SafeEmitter.PUBLIC) {
          client.emit(event[1], data);
          console.log(event);
        }
      });
      client.on('start', () => {
        this.events.emitIntern('start');
      });
    });

    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    this.app.get('/env', (req, res) => {
      res.json(this.info);
    });

    this.server.listen(3000);
    log.info('Listening on port 3000');
  }
}
