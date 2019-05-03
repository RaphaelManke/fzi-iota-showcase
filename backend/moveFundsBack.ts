import { composeAPI } from '@iota/core';
import { createAttachToTangle, log } from 'fzi-iota-showcase-client';

(async () => {
  try {
    const provider = 'http://localhost:14265';
    const iota = composeAPI({
      provider,
      attachToTangle: createAttachToTangle(provider),
    });
    console.log(await iota.getNodeInfo());
    const masterSeed =
      'AXYKAGJZLNLHYUANVNRBXECASFDJJDZNO9PQVQAFLBEHXGCSXSDPKPHWSR9YVU9LZRTSUAJEOPM9GYDXW';
    console.log(await iota.getAccountData(masterSeed));
    // const result = await iota.getNewAddress(masterSeed);
    // const address = Array.isArray(result) ? result[0] : result;
    // console.log(await iota.getBalances([address], 100));
    // log.info('Making transactions...');
    // await Promise.all(
    //   [
    //     'T9IJB9REDOA9JCOFT9MGCHCVU9TGMQDOAVTUQXLNFBGBXKOLTIWDIGSGNRAGNMPTBDBIUEPISSLFYCQOC',
    //     'T9VZNDCMMDZOJG9GA9RHRQKQVRWBJJWNSZIXHGKGGEMNSRWPHRJLVDP9OJEGZBHIA9DZRPVRTRDTNTZBX',
    //     'X9JJDO9DNVXEWKRUQSVHFJZPDOFWMGIMFSJIULFKTDKSRMRRAUQSDUBAHWQXXMNZMASDTFXDFADAOSUI9',
    //   ].map((seed) =>
    //     iota.getAccountData(seed).then(({ balance }) =>
    //       iota
    //         .prepareTransfers(seed, [{ address, value: balance }])
    //         .then((trytes) => iota.sendTrytes(trytes, 3, 14))
    //         .then((v) => console.log(v[0].hash))
    //         .catch((e) => log.error(e)),
    //     ),
    //   ),
    // );
  } catch (e) {
    log.error(e);
  }
})();
