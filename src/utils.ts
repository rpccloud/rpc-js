export
function stringToUTF8(v: string): Array<number> {
  let ret: Array<number> = [];
  let strPos: number = 0;
  let ch: number;

  while ((ch = v.charCodeAt(strPos++)) > 0) {
    if (ch >= 0xD800 && ch <= 0xDBFF) {
      let low: number = v.charCodeAt(strPos++);
      if (low >= 0xDC00 && low <= 0xDFFF) {
        ch = (((ch & 0x3FF) << 10) | (low & 0x3FF)) + 65536;
      } else {
        return [];
      }
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

export
function utf8ToString(
  v: Uint8Array,
  start?: number,
  end?: number,
): [string, boolean] {
  const retArray: Array<number> = [];
  let idx: number = (start === undefined) ? 0 : start;
  let readEnd: number = (end === undefined) ? v.byteLength : end;
  if (readEnd > v.byteLength || idx >= readEnd) {
    return ["", false];
  }

  const byteLen: number = v.byteLength;

  while (idx < readEnd) {
    const ch: number = v[idx];

    if (ch < 128) {
      idx++;
      retArray.push(ch);
    } else if (ch < 224) {
      if (idx + 1 < byteLen) {
        if ((v[idx + 1] & 0xC0) !== 0x80) {
          return ["", false];
        }
        const unicode: number =
          ((ch & 0x1F) << 6) |
          (v[idx + 1] & 0x3F);
        idx += 2;
        retArray.push(unicode);
      } else {
        return ["", false];
      }
    } else if (ch < 240) {
      if (idx + 2 < byteLen) {
        if (
          (v[idx + 1] & 0xC0) !== 0x80 ||
          (v[idx + 2] & 0xC0) !== 0x80
        ) {
          return ["", false];
        }
        const unicode: number =
          ((ch & 0x0F) << 12) |
          ((v[idx + 1] & 0x3F) << 6) |
          (v[idx + 2] & 0x3F);
        idx += 3;
        retArray.push(unicode);
      } else {
        return ["", false];
      }
    } else if (ch < 248) {
      if (idx + 3 < byteLen) {
        if (
          (v[idx + 1] & 0xC0) !== 0x80 ||
          (v[idx + 2] & 0xC0) !== 0x80 ||
          (v[idx + 3] & 0xC0) !== 0x80
        ) {
          return ["", false];
        }
        const unicode: number =
          ((ch & 0x07) << 18) |
          ((v[idx + 1] & 0x3F) << 12) |
          ((v[idx + 2] & 0x3F) << 6) |
          (v[idx + 3] & 0x3F);
        idx += 4;
        if (unicode >= 0x0000 && unicode <= 0xD7FF) {
          retArray.push(unicode);
        } else if (unicode >= 0xE000 && unicode <= 0xFFFF) {
          retArray.push(unicode);
        } else if (unicode >= 0x010000 && unicode <= 0x10FFFF) {
          retArray.push(unicode);
        } else {
          return ["", false];
        }
      }
    } else {
      return ["", false];
    }
  }
  return [String.fromCodePoint(...retArray), true];
}

