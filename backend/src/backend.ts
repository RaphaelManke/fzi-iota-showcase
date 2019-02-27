import * as socketio from 'socket.io';

(async () => {
    const io = socketio();
    io.on('connection', (client: any) => {
        console.log('it works!');
     });
    io.listen(3000);
    console.log('Listening on port 3000');
})();
