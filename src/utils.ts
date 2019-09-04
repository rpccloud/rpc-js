export
function isUint8ArrayEquals(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength != right.byteLength) {
    return false;
  }
  for (let i: number = 0; i < left.byteLength; i++) {
    if (left[i] != right[i]) {
      return false;
    }
  }
  return true;
}

