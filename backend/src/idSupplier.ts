const alphabet = '9ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let nextId = 0;

export function getNextId() {
  const id = nextId++;
  return intToTrytes(id);
}

function intToTrytes(input: number) {
  if (input === 0) {
    return alphabet[0];
  }
  let current = input;
  const result = [];
  while (current > 0) {
    const b = current % 27;
    current = Math.floor(current / 27);
    result.unshift(alphabet[b]);
  }
  return result.reduce((acc, v) => acc.concat(v), '');
}
