import { API } from '@iota/core';
import { Hash } from '@iota/core/typings/types';
import { getDateTag } from './dateTagger';
import { CheckInMessage } from './messages/checkInMessage';
import { trytesToInt } from './intTryteConverter';

export async function readCheckIns(iota: API, stop: Hash, ...dates: Date[]) {
  const txs = dates.length > 0 ? await iota.findTransactionObjects({
    addresses: [stop],
  }) : await iota.findTransactionObjects({
    addresses: [stop],
    tags: dates.map((d) => getDateTag(d)),
  });

  return txs.filter((tx) => tx.currentIndex === 0).filter((tx) => tx.lastIndex === 0)
    .map((tx) => ({ txHash: tx.hash, trytes: tx.signatureMessageFragment, timestamp: tx.attachmentTimestamp }))
    .map(({txHash, trytes, timestamp}) => ({ txHash, trytes, length: trytesToInt(trytes.slice(0, 3)), timestamp }) )
    .map(({txHash, trytes, length, timestamp}) => ({ txHash, message: trytes.slice(3, 3 + length), timestamp }))
    .map(({txHash, message, timestamp}) => ({
      txHash,
      message: CheckInMessage.fromTrytes(message),
      timestamp: new Date(timestamp),
  }));

}
