import * as express from 'express';
import * as socketio from 'socket.io';
import * as http from 'http';
import { log } from 'fzi-iota-showcase-client';
import { SafeEmitter } from './events';
import { Controller } from './controller';
import { trytes } from '@iota/converter';
import { Trytes } from '@iota/core/typings/types';

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
      log.info(`Connected to websocket client '%s'.`, client.id);
      const accept: Trytes[] = [];
      const deny: Trytes[] = [];
      this.controller.events.onAny((event: any, data: any) => {
        const id = getId(event, data);
        if (
          event[0] === SafeEmitter.PUBLIC &&
          (accept.length === 0 || accept.indexOf(id) > -1) &&
          deny.indexOf(id) === -1
        ) {
          client.emit(event[1], data);
        }
      });

      client.on('accept', (...data: Trytes[]) => {
        accept.push(...data);
      });
      client.on('deny', (...data: any) => {
        deny.push(...data);
      });
    });
    log.info('Configured websocket server.');

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
      res.contentType('application/json');
      res.charset = 'utf-8';
      res.send(
        JSON.stringify(this.controller.env, (key, value) =>
          value instanceof Int8Array ? trytes(value) : value,
        ),
      );
    });

    this.app.post('/login', (req, res) => {
      const user = this.controller.users.getBySeed(req.body);
      if (user) {
        if (!user.info.loggedIn) {
          user.info.loggedIn = true;
          this.controller.events.emit('Login', user.info);
          res.json(user.info);
        } else {
          res.status(406);
          res.json(user.info);
        }
      } else {
        res.status(404);
        res.send();
      }
    });

    this.app.post('/logout', (req, res) => {
      const user = this.controller.users.getBySeed(req.body);
      if (user) {
        if (user.info.loggedIn) {
          user.info.loggedIn = false;
          this.controller.events.emit('Logout', { id: user.info.id });
          res.json(user.info);
        } else {
          res.status(406);
          res.json(user.info);
        }
      } else {
        res.status(404);
        res.send();
      }
    });

    this.app.get('/routes', (req, res) => {
      if (req.query.start && req.query.destination) {
        const array = (input: any | any[]): any[] =>
          Array.isArray(input) ? input : [input];
        const types = req.query.types
          ? array(req.query.types)
          : ['tram', 'car', 'bike'];
        res.json(
          this.controller.getRoutes(
            req.query.start,
            req.query.destination,
            types,
          ),
        );
      } else {
        res.status(400);
        res.send();
      }
    });

    this.app.post('/stopTripAtNextStop', (req, res) => {
      const b = JSON.parse(req.body);
      const user = this.controller.users.getBySeed(b.seed);
      if (user) {
        if (user.info.trip) {
          try {
            const nextStop = this.controller.stopTripOnNextStop(
              user.info.trip.vehicleId,
              user.info.id,
            );
            res.send(nextStop);
          } catch (e) {
            res.status(400);
            res.send(e.message || e);
          }
        } else {
          res.status(400);
          res.send('User is not on a trip');
        }
      } else {
        res.status(404);
        res.send('User not found');
      }
    });

    this.app.post('/trip', (req, res) => {
      const b = JSON.parse(req.body);
      const vehicle = this.controller.env.vehicles.find(
        (v) => b.vehicle === v.id,
      );
      const user = this.controller.users.getBySeed(b.seed);
      if (user) {
        if (vehicle) {
          if (this.controller.env.stops.find((s) => s.id === b.start)) {
            if (this.controller.env.stops.find((s) => s.id === b.destination)) {
              if (
                b.intermediateStops.every((s: Trytes) =>
                  this.controller.env.stops.find((f) => f.id === s),
                )
              ) {
                this.controller
                  .startTrip(
                    vehicle,
                    user,
                    b.start,
                    b.intermediateStops,
                    b.destination,
                  )
                  .then(() => res.send())
                  .catch((reason) => {
                    res.status(400);
                    res.send(reason.message || reason);
                  });
              } else {
                res.status(404);
                res.send('Intermediate stop not found');
              }
            } else {
              res.status(404);
              res.send('Destination stop not found');
            }
          } else {
            res.status(404);
            res.send('Start stop not found');
          }
        } else {
          res.status(404);
          res.send('Vehicle not found');
        }
      } else {
        res.status(404);
        res.send('User not found');
      }
    });
    log.info('Configured HTTP server.');

    this.server.listen(3000);
    log.info('Listening on port 3000.');
  }
}

function getId(type: string[], data: any) {
  let prop;
  switch (type[1]) {
    case 'Login':
    case 'Logout':
    case 'PosUpdated':
      prop = 'id';
      break;
    case 'PaymentIssued':
      prop = 'from';
      break;
    case 'CheckIn':
    case 'ReachedStop':
    case 'Departed':
      prop = 'vehicleId';
      break;
    case 'TransactionIssued':
      prop = data.type === 'value' ? 'from' : 'vehicle';
      break;
    default:
      prop = 'userId';
      break;
  }
  return data[prop];
}
