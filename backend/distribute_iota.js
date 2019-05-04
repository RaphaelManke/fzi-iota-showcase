const iota = require('@iota/core');
const fs = require('fs');
const { createAttachToTangle } = require('fzi-iota-showcase-client');

const NUMBER_OF_SEEDS = 50;
const GENESIS_SEED =
  'SEED99999999999999999999999999999999999999999999999999999999999999999999999999999';

// Depth or how far to go for tip selection entry point.
const depth = 3;

// Difficulty of Proof-of-Work required to attach transaction to tangle.
// Minimum value on mainnet is `14`, `7` on spamnet and `9` on devnet and other testnets.
const minWeightMagnitude = 5;

function generateSeed(length = 81) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ9';
  const retVal = [];
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal[i] = charset.charAt(Math.floor(Math.random() * n));
  }
  const result = retVal.join('');
  return result;
}
const provider = 'http://localhost:14265';
var api = iota.composeAPI({
  provider,
  attachToTangle: createAttachToTangle(provider),
});

api
  .getNodeInfo()
  .then(info => console.log(info))
  .catch(error => {
    console.log(`Request error: ${error.message}`);
  });

var seeds = [];
// DO NOT OVERRIDE EXISTING SEEDS!
/*if (!fs.existsSync("./seeds.json")) {
  for (let i = 0; i < NUMBER_OF_SEEDS; i++) {
    seeds.push(generateSeed());
  }

  fs.writeFile("./seeds.json", JSON.stringify(seeds, null, 2), "utf-8");
}*/

seeds = JSON.parse(fs.readFileSync('./seeds.json', 'utf8'));

Promise.all(seeds.map(seed => api.getNewAddress(seed))).then(addresses => {
  const transfers = addresses.map(a => ({ address: a, value: 1000000000 }));
  api
    .prepareTransfers(GENESIS_SEED, transfers)
    .then(trytes => api.sendTrytes(trytes, depth, minWeightMagnitude))
    .then(bundle => {
      console.log(`Published transaction with tail hash: ${bundle[0].hash}`);
      console.log('Bundle:', bundle);
    })
    .catch(err => {
      console.error(err);
    });
});
