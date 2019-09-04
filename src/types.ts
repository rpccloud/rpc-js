export class RPCFloat64 {
  private readonly value: number;

  constructor(v: number) {
    this.value = v;
  }

  public toNumber(): number {
    return this.value
  }
}

export class RPCInt64 {
  private readonly value: number;
  private bytes: Uint8Array;

  constructor(v: number) {
    if (Number.isSafeInteger(v)) {
      this.value = v;
    } else {
      this.value = NaN;
    }
    this.bytes = new Uint8Array(0);
  }

  public static fromBytes(bytes: Uint8Array): RPCInt64 {
    if (bytes.byteLength === 8) {
      // value > 0 and is a safety integer
      if (bytes[7] === 128 && (bytes[6] & 0xE0) === 0) {
        const v = bytes[6] * 281474976710656 +
          bytes[5] * 1099511627776 +
          bytes[4] * 4294967296 +
          bytes[3] * 16777216 + (
            (bytes[2] << 16) | (bytes[1] << 8) | bytes[0]
          );
        return new RPCInt64(v);
      }

      // value < 0 and is a safety integer
      if (bytes[7] === 127 && (bytes[6] & 0xE0) === 0xE0) {
        const v = ((~bytes[6] & 0x1F) * 281474976710656 +
          ((~bytes[5]&0xff) * 1099511627776) +
          ((~bytes[4]&0xff) * 4294967296) +
          ((~bytes[3]&0xff) * 16777216) +
          ((~bytes[2]&0xff) * 65536) +
          ((~bytes[1]&0xff) * 256) +
          (~bytes[0]&0xff));

        // v >= -9007199254740991
        if (v < 9007199254740991) {
          return new RPCInt64( -v - 1);
        }
      }

      let ret = new RPCInt64(NaN);
      ret.bytes = new Uint8Array(8);
      for (let i = 0; i < 8; i++) {
        ret.bytes[i] = bytes[i];
      }
      return ret
    } else {
      return new RPCInt64(NaN);
    }
  }

  public toNumber(): number {
    return this.value
  }

  public getBytes(): Uint8Array {
    return this.bytes
  }

  public valueOf(): number {
    return this.value
  }
}

export class RPCUint64 {
  private readonly value: number;
  private bytes: Uint8Array;

  constructor(v: number) {
    if (Number.isSafeInteger(v) && v >= 0) {
      this.value = v;
    } else {
      this.value = NaN;
    }
    this.bytes = new Uint8Array(0);
  }

  public static fromBytes(bytes: Uint8Array): RPCUint64 {
    if (bytes.byteLength === 8) {
      // value > 0 and is a safety integer
      if (bytes[7] === 0 && (bytes[6] & 0xE0) === 0) {
        const v = bytes[6] * 281474976710656 +
          bytes[5] * 1099511627776 +
          bytes[4] * 4294967296 +
          bytes[3] * 16777216 + (
            (bytes[2] << 16) | (bytes[1] << 8) | bytes[0]
          );
        return new RPCUint64(v);
      }

      let ret = new RPCUint64(NaN);
      ret.bytes = new Uint8Array(8);
      for (let i = 0; i < 8; i++) {
        ret.bytes[i] = bytes[i];
      }
      return ret
    } else {
      return new RPCUint64(NaN);
    }
  }

  public toNumber(): number {
    return this.value
  }

  public getBytes(): Uint8Array {
    return this.bytes
  }
}
