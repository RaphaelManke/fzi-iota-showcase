import { AttachToTangle, Hash, Trytes, Callback } from '@iota/core/typings/types';
/// <reference types="bluebird" />
import * as Promise from 'bluebird';

export function createAttachToTangle(
    apiKey?: string, timeout = 3000, apiServer = 'https://api.powsrv.io:443'): AttachToTangle {
  return (trunkTransaction: Hash, branchTransaction: Hash, minWeightMagnitude: number,
          trytes: ReadonlyArray<Trytes>, callback?: Callback<ReadonlyArray<Trytes>>) => {
    return new Promise((resolve, reject) => {
      const command = {
        command: 'attachToTangle',
        trunkTransaction,
        branchTransaction,
        minWeightMagnitude,
        trytes,
      };

      const params: any = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-IOTA-API-Version': '1',
        },
        body: JSON.stringify(command),
        timeout,
      };

      if (apiKey) {
        params.headers.Authorization = 'powsrv-token ' + apiKey;
      }
      fetch(apiServer, params)
      .then((response) => {
        if (response.status !== 200) {
          reject(`failed to contact the PowSrv API: ${response.status}`);
        } else {
          response.json().then((data) => {
            resolve(data.trytes);
          });
        }
      });
    });
  };
}
