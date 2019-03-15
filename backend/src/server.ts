import * as express from 'express';
import * as socketio from 'socket.io';
import * as http from 'http';
import { log } from 'fzi-iota-showcase-client';
import Controller from './controller';

export class Server {
  private io: SocketIO.Server;
  private con: Controller;
  private app: express.Application;
  private server: http.Server;

  constructor(con: Controller) {
    this.con = con;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketio(this.server);
  }

  public listen() {
    this.io.on('connection', (client: SocketIO.Socket) => {
      log.info('Connected to websocket client.');
      this.con.events.onAny((event: any, data: any) => client.emit(event, data));
      client.on('start', () => {
        this.con.events.emit('start');
      });
    });

    this.app.get('/env', (req, res) => {
      res.json(this.con.env.info);
    });

    this.server.listen(3000);
    log.info('Listening on port 3000');
  }
}
