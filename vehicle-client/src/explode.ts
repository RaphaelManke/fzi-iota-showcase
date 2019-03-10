import Kerl from '@iota/kerl';

function mod(x: number, y: number) {
  if (x >= 0) {
    return x % y;
  } else {
    let r = x;
    do {
      r = y + r;
    } while (r < 0);
    return r;
  }
}

export function explode(seed: Int8Array) {
  const kerl = new Kerl();
  kerl.initialize();
  const parts = 3;
  const sliceLength = seed.length / parts;
  const slice = (i: number) => seed.slice(i * sliceLength, (i + 1) * sliceLength);
  for (let i = 0; i < parts; i++) {
    const part = new Int8Array(Kerl.HASH_LENGTH);
    for (let j = 0; j < parts; j++) {
      part.set(slice(mod(i - j, parts)), j * sliceLength);
    }
    kerl.absorb(part, 0, Kerl.HASH_LENGTH);
  }
  const buffer = new Int8Array(Kerl.HASH_LENGTH);
  kerl.squeeze(buffer, 0, Kerl.HASH_LENGTH);
  return buffer;
}
