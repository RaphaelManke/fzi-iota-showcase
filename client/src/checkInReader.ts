import { API } from '@iota/core';
import { Hash } from '@iota/core/typings/types';
import { getDateTag } from './dateTagger';
import { CheckInMessage } from './messages/checkInMessage';

export async function readCheckIns(iota: API, stop: Hash, ...dates: Date[]) {
  const txs = dates.length > 0 ? await iota.findTransactionObjects({
    addresses: [stop],
  }) : await iota.findTransactionObjects({
    addresses: [stop],
    tags: dates.map((d) => getDateTag(d)),
  });

  return txs.filter((tx) => tx.currentIndex === 0).filter((tx) => tx.lastIndex === 0)
    .map((tx) => [tx.hash, tx.signatureMessageFragment])
    .map(([txHash, trytes]) => ({
      txHash,
      message: CheckInMessage.fromTrytes(trytes)
    }));
}
