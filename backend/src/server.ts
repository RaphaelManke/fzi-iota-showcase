import * as express from 'express';
import * as socketio from 'socket.io';
import * as http from 'http';
import { log } from 'fzi-iota-showcase-client';
import { SafeEmitter, Login } from './events';
import { EnvironmentInfo, User } from './envInfo';
import { Controller } from './controller';

export class Server {
  private io: SocketIO.Server;
  private app: express.Application;
  private server: http.Server;

  constructor(private controller: Controller) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketio(this.server);
  }

  public listen() {
    this.io.on('connection', (client: SocketIO.Socket) => {
      log.info('Connected to websocket client.');
      this.controller.events.onAny((event: any, data: any) => {
        if (event[0] === SafeEmitter.PUBLIC) {
          client.emit(event[1], data);
        }
      });
      client.on('start', () => {
        this.controller.events.emitIntern('start');
      });
    });

    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
      );
      next();
    });

    this.app.use((req, res, next) => {
      let data = '';
      req.setEncoding('utf8');
      req.on('data', (chunk) => {
        data += chunk;
      });

      req.on('end', () => {
        req.body = data;
        next();
      });
    });

    this.app.get('/env', (req, res) => {
      res.json(this.controller.env);
    });

    this.app.post('/login', (req, res) => {
      const user = this.controller.users.getBySeed(req.body);
      if (user) {
        if (!user.loggedIn) {
          user.loggedIn = true;
          this.controller.events.emit('Login', user);
          res.json(user);
        } else {
          res.status(406);
          res.json(user);
        }
      } else {
        res.status(404);
        res.send();
      }
    });

    this.server.listen(3000);
    log.info('Listening on port 3000');
  }
}
