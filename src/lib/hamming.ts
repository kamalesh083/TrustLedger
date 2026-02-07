export function hammingDistance64(hexA: string, hexB: string): number {
  const a = BigInt(hexA);
  const b = BigInt(hexB);
  let x = a ^ b;
  let count = 0;
  while (x !== 0n) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}
