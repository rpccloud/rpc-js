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

export
function stringToUTF8(v: string): Array<number> {
  let ret: Array<number> = [];
  let strPos: number = 0;
  let ch: number;

  while ((ch = v.charCodeAt(strPos++)) > 0) {
    if (ch >= 0xD800 && ch <= 0xDBFF) {
      let low: number = v.charCodeAt(strPos++);
      ch = (((ch & 0x3FF) << 10) | (low & 0x3FF)) + 65536;
    }
    if (ch < 128) {
      ret.push(ch);
    } else if (ch < 2048) {
      ret.push((ch >>> 6) | 0xC0);
      ret.push((ch & 0x3F) | 0x80);
    } else if (ch < 65536) {
      ret.push((ch >>> 12) | 0xE0);
      ret.push(((ch >>> 6) & 0x3F) | 0x80);
      ret.push((ch & 0x3F) | 0x80);
    } else if (ch < 2097152) {
      ret.push((ch >>> 18) | 0xF0);
      ret.push(((ch >>> 12) & 0x3F) | 0x80);
      ret.push(((ch >>> 6) & 0x3F) | 0x80);
      ret.push((ch & 0x3F) | 0x80);
    } else {
      return [];
    }
  }

  return ret;
}
