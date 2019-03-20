import { API } from '@iota/core';
import { Hash } from '@iota/core/typings/types';
import { getDateTag } from './dateTagger';
import { CheckInMessage } from './messages/checkInMessage';
import { trytesToInt } from './intTryteConverter';
import { log } from './logger';

export async function readCheckIns(iota: API, stop: Hash, ...dates: Date[]):
    Promise<Array<{txHash: Hash, message: CheckInMessage, timestamp: Date}>> {
  const query = dates.length === 0 ? {
    addresses: [stop],
  } : {
    addresses: [stop],
    tags: dates.map((d) => getDateTag(d)),
  };
  log.debug('Querying transactions with query: %O', query);
  const txs = await iota.findTransactionObjects(query);
  log.debug('Read %s transactions from stop address', txs.length);

  return txs.filter((tx) => tx.currentIndex === 0).filter((tx) => tx.lastIndex === 0)
    .map((tx) => ({ txHash: tx.hash, trytes: tx.signatureMessageFragment, timestamp: tx.attachmentTimestamp }))
    // seperate length from payload trytes
    .map(({txHash, trytes, timestamp}) => ({ txHash, trytes, length: trytesToInt(trytes.slice(0, 3)), timestamp }) )
    .map(({txHash, trytes, length, timestamp}) => ({ txHash, message: trytes.slice(3, 3 + length), timestamp }))
    .map(({txHash, message, timestamp}) => ({
      txHash,
      message: onErrorUndefined(() => CheckInMessage.fromTrytes(message)),
      timestamp: new Date(timestamp),
  // filter out undefined messages and tell the compiler that
  })).filter((e) => e.message !== undefined).map((e) => ({...e, message: e.message!}));
}

function onErrorUndefined<T>(supplier: () => T) {
  try {
    return supplier();
  } catch (e) {
    return undefined;
  }
}
