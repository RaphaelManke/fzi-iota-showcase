const zmq = require('zeromq');
const server = require('http').createServer();
const io = require('socket.io')(server);
const transaction = require('@iota/transaction-converter');
const iota = require('@iota/core').composeAPI({
  provider: 'http://192.168.1.104:14265',
});

let coordinatorAddress;
iota.getNodeInfo().then(i => {
  console.log(i);
  coordinatorAddress = i.coordinatorAddress;
});
const cooBundles = new Set();
const txs = new Set();

io.on('connection', client => {
  console.log('Connected');
  sock = zmq.socket('sub');
  sock.connect('tcp://192.168.1.104:5556');
  sock.subscribe('tx_trytes');
  sock.on('message', async function(topic) {
    const tp = topic.toString();
    const arr = tp.split(' ');

    const tx = transaction.asTransactionObject(arr[1], arr[2]);

    const emit = async (tx, left = 50) => {
      const milestone =
        tx.address === coordinatorAddress || cooBundles.has(tx.bundle);
      if (milestone) {
        cooBundles.add(tx.bundle);
      }
      if (!txs.has(tx.hash)) {
        txs.add(tx.hash);

        if (!txs.has(tx.branchTransaction) && left > 0) {
          left--;
          try {
            const [branch] = await iota.getTransactionObjects([
              tx.branchTransaction,
            ]);
            if (branch) {
              console.log('Loaded branch tx:', branch.hash);
              await emit(branch, left);
            }
          } catch (e) {
            console.error(e);
          }
        }
        if (!txs.has(tx.trunkTransaction) && left > 0) {
          left--;
          try {
            const [trunk] = await iota.getTransactionObjects([
              tx.trunkTransaction,
            ]);
            if (trunk) {
              console.log('Loaded trunk tx:', trunk.hash);
              await emit(trunk, left);
            }
          } catch (e) {
            console.error(e);
          }
        }

        client.emit('tx', {
          trunk: tx.trunkTransaction,
          branch: tx.branchTransaction,
          hash: tx.hash,
          milestone,
        });
      }
    };
    await emit(tx);
  });
});
server.listen(3001);
