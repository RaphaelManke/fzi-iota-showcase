import {
  AttachToTangle,
  Hash,
  Trytes,
  Callback,
} from '@iota/core/typings/types';
import { createAttachToTangle as org } from '@iota/core';
/// <reference types="bluebird" />
import * as Promise from 'bluebird';
import { createHttpClient } from '@iota/http-client';
import { log } from './logger';

export function createAttachToTangle(
  provider?: string,
  apiKey?: string,
  timeout = 3000,
  apiServer = 'https://api.powsrv.io:443',
): AttachToTangle {
  let fallback: AttachToTangle;
  if (provider) {
    const client = createHttpClient({ provider });
    fallback = org(client);
  }

  return (
    trunkTransaction: Hash,
    branchTransaction: Hash,
    minWeightMagnitude: number,
    trytes: ReadonlyArray<Trytes>,
    callback?: Callback<ReadonlyArray<Trytes>>,
  ) => {
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

      const fb = (response: Response | string) => {
        const message = `failed to contact the PowSrv API: ${
          typeof response === 'string' || !response.status
            ? response
            : response.status
        }.`;
        if (fallback) {
          log.warn(`${message} Using default remote pow as fallback.`);
          fallback(
            trunkTransaction,
            branchTransaction,
            minWeightMagnitude,
            trytes,
            callback,
          )
            .then(resolve)
            .catch((reason) => reject(reason));
        } else {
          reject(message);
        }
      };

      fetch(apiServer, params)
        .then((response) => {
          if (response.status !== 200) {
            fb(response);
          } else {
            response.json().then((data) => {
              resolve(data.trytes);
            });
          }
        })
        .catch((reason) => {
          fb(reason);
        });
    });
  };
}
