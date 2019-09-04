export class RPCFloat64 {
  private readonly value: number;

  public constructor(v: number) {
    this.value = v;
  }

  public toNumber(): number {
    return this.value;
  }
}

export class RPCInt64 {
  private readonly value: number;
  private bytes: Uint8Array;

  public constructor(v: number) {
    this.value = Number.isSafeInteger(v) ? v : NaN;
    this.bytes = new Uint8Array(0);
  }

  public static fromBytes(bytes: Uint8Array): RPCInt64 {
    if (bytes.byteLength === 8) {
      // value > 0 and is a safety integer
      if (bytes[7] === 128 && (bytes[6] & 0xE0) === 0) {
        const v: number =
          (bytes[6] & 0x1F) * 281474976710656 +
          (bytes[5] & 0xFF) * 1099511627776 +
          (bytes[4] & 0xFF) * 4294967296 +
          (bytes[3] & 0xFF) * 16777216 +
          (bytes[2] & 0xFF) * 65536 +
          (bytes[1] & 0xFF) * 256 +
          (bytes[0] & 0xFF);
        return new RPCInt64(v);
      }

      // value < 0 and is a safety integer
      if (bytes[7] === 127 && (bytes[6] & 0xE0) === 0xE0) {
        const v: number =
          (~bytes[6] & 0x1F) * 281474976710656 +
          (~bytes[5] & 0xFF) * 1099511627776 +
          (~bytes[4] & 0xFF) * 4294967296 +
          (~bytes[3] & 0xFF) * 16777216 +
          (~bytes[2] & 0xFF) * 65536 +
          (~bytes[1] & 0xFF) * 256 +
          (~bytes[0] & 0xFF);
        // v >= -9007199254740991
        if (v < 9007199254740991) {
          return new RPCInt64( -v - 1);
        }
      }

      let ret: RPCInt64 = new RPCInt64(NaN);
      ret.bytes = new Uint8Array(8);
      for (let i: number = 0; i < 8; i++) {
        ret.bytes[i] = bytes[i];
      }
      return ret;
    } else {
      return new RPCInt64(NaN);
    }
  }

  public toNumber(): number {
    return this.value;
  }

  public getBytes(): Uint8Array {
    return this.bytes;
  }
}

export class RPCUint64 {
  private readonly value: number;
  private bytes: Uint8Array;

  public constructor(v: number) {
    this.value =  (Number.isSafeInteger(v) && v >= 0) ? v : NaN;
    this.bytes = new Uint8Array(0);
  }

  public static fromBytes(bytes: Uint8Array): RPCUint64 {
    if (bytes.byteLength === 8) {
      // value > 0 and is a safety integer
      if (bytes[7] === 0 && (bytes[6] & 0xE0) === 0) {
        const v: number =
          (bytes[6] & 0x1F) * 281474976710656 +
          (bytes[5] & 0xFF) * 1099511627776 +
          (bytes[4] & 0xFF) * 4294967296 +
          (bytes[3] & 0xFF) * 16777216 +
          (bytes[2] & 0xFF) * 65536 +
          (bytes[1] & 0xFF) * 256 +
          (bytes[0] & 0xFF);
        return new RPCUint64(v);
      }

      let ret: RPCUint64 = new RPCUint64(NaN);
      ret.bytes = new Uint8Array(8);
      for (let i: number = 0; i < 8; i++) {
        ret.bytes[i] = bytes[i];
      }
      return ret;
    } else {
      return new RPCUint64(NaN);
    }
  }

  public toNumber(): number {
    return this.value;
  }

  public getBytes(): Uint8Array {
    return this.bytes;
  }
}
