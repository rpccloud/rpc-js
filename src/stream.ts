import {Ieee754} from "./ieee754";
import {RPCFloat64, RPCInt64, RPCUint64} from "./types";
import {stringToUTF8, utf8ToString} from "./utils";

export class RPCStream {
  private data: Uint8Array;
  private readPos: number;
  private writePos: number;

  public constructor() {
    this.data = new Uint8Array(1024);
    this.data[0] = 1;
    this.readPos = 17;
    this.writePos = 17;
  }

  private enlarge(size: number): void {
    if (size > this.data.byteLength) {
      const newData: Uint8Array = new Uint8Array(size + 1024);
      newData.set(this.data, 0);
      this.data = newData;
    }
  }

  private putByte(value: number): void {
    this.enlarge(this.writePos + 1);
    this.data[this.writePos] = value;
    this.writePos++;
  }

  private putBytes(value: Array<number>): void {
    this.enlarge(this.writePos + value.length);
    for (let n of value) {
      this.data[this.writePos] = n;
      this.writePos++;
    }
  }

  private peekByte(): number {
    if (this.readPos < this.writePos) {
      return this.data[this.readPos];
    } else {
      return -1;
    }
  }

  private readNBytes(n: number): Uint8Array {
    if (n > 0 && Number.isInteger(n)) {
      const end: number = this.readPos + n;
      if (end <= this.writePos) {
        const ret: Uint8Array = this.data.slice(this.readPos, end);
        this.readPos = end;
        return ret;
      }
    }
    return new Uint8Array([]);
  }

  // private peekNBytes(n: number): Uint8Array {
  //   if (n > 0 && Number.isInteger(n)) {
  //     const end: number = this.readPos + n;
  //     if (end <= this.writePos) {
  //       return this.data.slice(this.readPos, end);
  //     }
  //   }
  //   return new Uint8Array([]);
  // }

  private putUint8Bytes(value: Uint8Array): void {
    this.enlarge(this.writePos + value.byteLength);
    for (let n of value) {
      this.data[this.writePos] = n;
      this.writePos++;
    }
  }

  public getReadPos(): number {
    return this.readPos;
  }

  public setReadPos(readPos: number): boolean {
    if (readPos >= 0 && readPos <= this.writePos) {
      this.readPos = readPos;
      return true;
    } else {
      return false;
    }
  }

  public getWritePos(): number {
    return this.writePos;
  }

  public setWritePos(writePos: number): boolean {
    if (writePos >= 0) {
      this.writePos = writePos;
      return true;
    } else {
      return false;
    }
  }

  public getBuffer(): Uint8Array {
    return this.data.slice(0, this.writePos);
  }

  public reset(): void {
    this.writePos = 17;
    this.readPos = 17;
  }

  public getClientCallbackID(): number {
    let data: Uint8Array = this.data;
    return (data[4] * 16777216) + (
      (data[3] << 16)
      | (data[2] << 8)
      | data[1]
    );
  }

  public setClientCallbackID(id: number): void {
    const originWritePos: number = this.writePos;

    this.writePos = 1;
    this.putByte(id);
    id >>>= 8;
    this.putByte(id);
    id >>>= 8;
    this.putByte(id);
    this.putByte(id >>> 8);

    this.writePos = originWritePos;
  }

  public canRead(): boolean {
    return this.readPos < this.writePos;
  }

  public writeNull(): void {
    this.putByte(1);
  }

  public writeBool(v: boolean): void {
    if (v) {
      this.putByte(2);
    } else {
      this.putByte(3);
    }
  }

  public writeFloat64(value: RPCFloat64): boolean {
    const v: number = value.toNumber();
    if (v === 0) {
      this.putByte(4);
      return true;
    } else if (!Number.isNaN(v)) {
      this.putByte(5);
      let arr: Array<number> = [];
      Ieee754.write(arr, v, 0, true, 52, 8);
      this.putBytes(arr);
      return true;
    } else {
      return false;
    }
  }

  public writeInt64(value: RPCInt64): boolean {
    let v: number = value.toNumber();

    if (v > -8 && v < 33) {
      this.putByte(v + 21);
      return true;
    } else if (v >= -32768 && v < 32768) {
      v += 32768;
      this.putByte(6);
      this.putByte(v);
      this.putByte(v >>> 8);
      return true;
    } else if (v >= -2147483648 && v < 2147483648) {
      v += 2147483648;
      this.putByte(7);
      this.putByte(v);
      v >>>= 8;
      this.putByte(v);
      v >>>= 8;
      this.putByte(v);
      this.putByte(v >>> 8);
      return true;
    } else if (v >= -9007199254740991 && v <= 9007199254740991) {
      const negative: boolean = v < 0;
      if (negative) {
        v += 9007199254740992;
      }
      this.putByte(8);
      this.putByte(v);
      v = (v - (v & 0xFF)) / 256;
      this.putByte(v);
      v = (v - (v & 0xFF)) / 256;
      this.putByte(v);
      v = (v - (v & 0xFF)) / 256;
      this.putByte(v);
      v >>>= 8;
      this.putByte(v);
      v >>>= 8;
      this.putByte(v);
      if (negative) {
        this.putByte((v >>> 8) | 0xE0);
        this.putByte(0x7F);
      } else {
        this.putByte((v >>> 8) & 0x1F);
        this.putByte(0x80);
      }
      return true;
    } else {
      const bytes: Uint8Array = value.getBytes();
      if (isNaN(v) && bytes.byteLength == 8) {
        this.putByte(8);
        for (let i: number = 0; i < 8; i++) {
          this.putByte(bytes[i]);
        }
        return true;
      } else {
        return false;
      }
    }
  }

  public writeUint64(value: RPCUint64): boolean {
    let v: number = value.toNumber();

    if (v < 10) {
      this.putByte(v + 54);
      return true;
    } else if (v < 65536) {
      this.putByte(9);
      this.putByte(v);
      this.putByte(v >>> 8);
      return true;
    } else if (v < 4294967296) {
      this.putByte(10);
      this.putByte(v);
      v >>>= 8;
      this.putByte(v);
      v >>>= 8;
      this.putByte(v);
      this.putByte(v >>> 8);
      return true;
    } else if (v <= 9007199254740991) {
      this.putByte(11);
      this.putByte(v);
      v = (v - (v & 0xFF)) / 256;
      this.putByte(v);
      v = (v - (v & 0xFF)) / 256;
      this.putByte(v);
      v = (v - (v & 0xFF)) / 256;
      this.putByte(v);
      v >>>= 8;
      this.putByte(v);
      v >>>= 8;
      this.putByte(v);
      this.putByte((v >>> 8) & 0x1F);
      this.putByte(0x00);
      return true;
    } else {
      const bytes: Uint8Array = value.getBytes();
      if (isNaN(v) && bytes.byteLength == 8) {
        this.putByte(11);
        for (let i: number = 0; i < 8; i++) {
          this.putByte(bytes[i]);
        }
        return true;
      } else {
        return false;
      }
    }
  }

  public writeString(v: string): boolean {
    if (v === null) {
      return false;
    }

    if (v === "") {
      this.putByte(128);
      return true;
    }

    const strBuffer: Array<number> = stringToUTF8(v);
    let length: number = strBuffer.length;

    if (length <= 0) {  // to utf8 error
      return false;
    } else if (length < 63) {
      // write header
      this.putByte(length + 128);
      // write body
      this.putBytes(strBuffer);
      // write tail
      this.putByte(0);
      return true;
    } else {
      // write header
      this.putByte(191);
      // write length
      this.putByte(length);
      length >>>= 8;
      this.putByte(length);
      length >>>= 8;
      this.putByte(length);
      this.putByte(length >>> 8);
      // write body
      this.putBytes(strBuffer);
      // write tail
      this.putByte(0);
      return true;
    }
  }

  public writeBytes(v: Uint8Array): boolean {
    if (v === null) {
      return false;
    }
    let length: number = v.byteLength;

    if (length == 0) {
      this.putByte(192);
      return true;
    } else if (length < 63) {
      // write header
      this.putByte(length + 192);
      // write body
      this.putUint8Bytes(v);
      return true;
    } else {
      // write header
      this.putByte(255);
      // write length
      this.putByte(length);
      length >>>= 8;
      this.putByte(length);
      length >>>= 8;
      this.putByte(length);
      this.putByte(length >>> 8);
      // write body
      this.putUint8Bytes(v);
      return true;
    }
  }

  public writeArray(v: Array<any>): boolean {
    if (v === null) {
      return false;
    }

    const arrLen: number = v.length;
    if (arrLen === 0) {
      this.putByte(64);
      return true;
    }

    const startPos: number = this.writePos;
    if (arrLen > 30) {
      this.putByte(95);
    } else {
      this.putByte(arrLen + 64);
    }

    this.writePos += 4;

    if (arrLen > 30) {
      let writeLen: number = arrLen;
      this.putByte(writeLen);
      writeLen >>>= 8;
      this.putByte(writeLen);
      writeLen >>>= 8;
      this.putByte(writeLen);
      this.putByte(writeLen >>> 8);
    }

    for (let i: number = 0; i < arrLen; i++) {
      if (!this.write(v[i])) {
        this.setWritePos(startPos);
        return false;
      }
    }

    // write total length
    const endPos: number = this.writePos;
    let totalLength: number = endPos - startPos;
    this.writePos = startPos + 1;
    this.putByte(totalLength);
    totalLength >>>= 8;
    this.putByte(totalLength);
    totalLength >>>= 8;
    this.putByte(totalLength);
    this.putByte(totalLength >>> 8);
    this.writePos = endPos;

    return true;
  }

  public writeMap(v: Map<string, any>): boolean {
    if (v === null) {
      return false;
    }

    const mapLen: number = v.size;
    if (mapLen === 0) {
      this.putByte(96);
      return true;
    }
    const startPos: number = this.writePos;
    if (mapLen > 30) {
      this.putByte(127);
    } else {
      this.putByte(mapLen + 96);
    }
    this.writePos += 4;
    if (mapLen > 30) {
      let writeLen: number = mapLen;
      this.putByte(writeLen);
      writeLen >>>= 8;
      this.putByte(writeLen);
      writeLen >>>= 8;
      this.putByte(writeLen);
      this.putByte(writeLen >>> 8);
    }

    for (let [key, value] of v) {
      if (!this.writeString(key)) {
        this.setWritePos(startPos);
        return false;
      }
      if (!this.write(value)) {
        this.setWritePos(startPos);
        return false;
      }
    }

    // write total length
    const endPos: number = this.writePos;
    let totalLength: number = endPos - startPos;
    this.writePos = startPos + 1;
    this.putByte(totalLength);
    totalLength >>>= 8;
    this.putByte(totalLength);
    totalLength >>>= 8;
    this.putByte(totalLength);
    this.putByte(totalLength >>> 8);
    this.writePos = endPos;

    return true;
  }

  public write(v: any): boolean {
    if (v === null) {
      this.writeNull();
      return true;
    }

    switch (typeof v) {
      case "boolean":
        this.writeBool(v);
        return true;
      case "string":
        return this.writeString(v);
      case "object":
        if (v instanceof RPCInt64) {
          return this.writeInt64(v);
        } else if (v instanceof RPCUint64) {
          return this.writeUint64(v);
        } else if (v instanceof RPCFloat64) {
          return this.writeFloat64(v);
        } else if (v instanceof Uint8Array) {
          return this.writeBytes(v);
        } else if (v instanceof Array) {
          return this.writeArray(v);
        } else if (v instanceof Map) {
          return this.writeMap(v);
        } else {
          return false;
        }
      default:
        return false;
    }
  }

  public readNull(): boolean {
    if (this.peekByte() === 1) {
      this.readPos++;
      return true;
    } else {
      return false;
    }
  }

  public readBool(): [boolean, boolean] {
    const ch: number = this.peekByte();

    if (ch === 2) {
      this.readPos++;
      return [true, true];
    } else if (ch === 3) {
      this.readPos++;
      return [false, true];
    } else {
      return [false, false];
    }
  }

  public readFloat64(): [RPCFloat64, boolean] {
    const ch: number = this.peekByte();
    if (ch === 4) {
      this.readPos++;
      return [new RPCFloat64(0), true];
    } else if (ch === 5) {
      const bytes: Uint8Array = this.readNBytes(9);
      if (bytes.byteLength === 9) {
        const v: number =
          Ieee754.read(bytes, 1, true, 52, 8);
        return [new RPCFloat64(v), true];
      }
    }

    return [new RPCFloat64(NaN), false];
  }

  public readInt64(): [RPCInt64, boolean] {
    const ch: number = this.peekByte();
    if (ch > 13 && ch < 54) {
      this.readPos++;
      return [new RPCInt64(ch - 21), true];
    } else {
      switch (ch) {
        case 6: {
          const bytes: Uint8Array = this.readNBytes(3);
          if (bytes.byteLength === 3) {
            const v: number =
              (bytes[2] & 0xFF) * 256 +
              (bytes[1] & 0xFF) -
              32768;
            return [new RPCInt64(v), true];
          }
          break;
        }
        case 7: {
          const bytes: Uint8Array = this.readNBytes(5);
          if (bytes.byteLength === 5) {
            const v: number =
              (bytes[4] & 0xFF) * 16777216 +
              (bytes[3] & 0xFF) * 65536 +
              (bytes[2] & 0xFF) * 256 +
              (bytes[1] & 0xFF) -
              2147483648;
            return [new RPCInt64(v), true];
          }
          break;
        }
        case 8: {
          const bytes: Uint8Array = this.readNBytes(9);
          if (bytes.byteLength === 9) {
            return [RPCInt64.fromBytes(bytes.slice(1)), true];
          }
          break;
        }
        default:
          break;
      }
      return [new RPCInt64(NaN), false];
    }
  }

  public readUint64(): [RPCUint64, boolean] {
    const ch: number = this.peekByte();
    if (ch > 53 && ch < 64) {
      this.readPos++;
      return [new RPCUint64(ch - 54), true];
    } else {
      switch (ch) {
        case 9: {
          const bytes: Uint8Array = this.readNBytes(3);
          if (bytes.byteLength === 3) {
            const v: number =
              (bytes[2] & 0xFF) * 256 +
              (bytes[1] & 0xFF);
            return [new RPCUint64(v), true];
          }
          break;
        }
        case 10: {
          const bytes: Uint8Array = this.readNBytes(5);
          if (bytes.byteLength === 5) {
            const v: number =
              (bytes[4] & 0xFF) * 16777216 +
              (bytes[3] & 0xFF) * 65536 +
              (bytes[2] & 0xFF) * 256 +
              (bytes[1] & 0xFF);
            return [new RPCUint64(v), true];
          }
          break;
        }
        case 11: {
          const bytes: Uint8Array = this.readNBytes(9);
          if (bytes.byteLength === 9) {
            return [RPCUint64.fromBytes(bytes.slice(1)), true];
          }
          break;
        }
        default:
          break;
      }
      return [new RPCUint64(NaN), false];
    }
  }

  public readString(): [string, boolean] {
    const ch: number = this.peekByte();
    if (ch === 128) {
      this.readPos++;
      return ["", true];
    } else if (ch > 128 && ch < 191) {
      const oldReadPos: number = this.readPos;
      const length: number = ch - 128;
      const bytes: Uint8Array = this.readNBytes(length + 2);
      if (bytes.byteLength === length + 2 && bytes[length + 1] === 0) {
        let [v, ok] = utf8ToString(bytes, 1, length + 1);
        if (ok) {
          return [v, true];
        }
      }
      this.setReadPos(oldReadPos);
      return ["", false];
    } else if (ch == 191) {
      const oldReadPos: number = this.readPos;
      const lenBytes: Uint8Array = this.readNBytes(5);
      if (lenBytes.byteLength === 5) {
        const length: number =
          (lenBytes[4] & 0xFF) * 16777216 +
          (lenBytes[3] & 0xFF) * 65536 +
          (lenBytes[2] & 0xFF) * 256 +
          (lenBytes[1] & 0xFF);
        if (length > 62) {
          const bytes: Uint8Array = this.readNBytes(length + 1);
          if (bytes.byteLength === length + 1 && bytes[length] === 0) {
            let [v, ok] = utf8ToString(bytes, 0, length);
            if (ok) {
              return [v, true];
            }
          }
        }
      }
      this.setReadPos(oldReadPos);
      return ["", false];
    }
    return ["", false];
  }

  public readBytes(): [Uint8Array, boolean] {
    const ch: number = this.peekByte();
    if (ch === 192) {
      this.readPos++;
      return [new Uint8Array([]), true];
    } else if (ch > 192 && ch < 255) {
      const length: number = ch - 192;
      const bytes: Uint8Array = this.readNBytes(length + 1);
      if (bytes.byteLength === length + 1) {
        return [bytes.slice(1), true];
      }
    } else if (ch === 255) {
      const oldReadPos: number = this.readPos;
      const lenBytes: Uint8Array = this.readNBytes(5);
      if (lenBytes.byteLength === 5) {
        const length: number =
          (lenBytes[4] & 0xFF) * 16777216 +
          (lenBytes[3] & 0xFF) * 65536 +
          (lenBytes[2] & 0xFF) * 256 +
          (lenBytes[1] & 0xFF);
        if (length > 62) {
          const bytes: Uint8Array = this.readNBytes(length);
          if (bytes.byteLength === length) {
            return [bytes, true];
          }
        }
      }
      this.setReadPos(oldReadPos);
      return [new Uint8Array([]), false];
    }

    return [new Uint8Array([]), false];
  }

  public readArray(): [Array<any>, boolean] {
    const ch: number = this.peekByte();

    if (ch >= 64 && ch < 96) {
      let arrLen: number = 0;
      let totalLen: number = 0;
      let readStart: number = this.readPos;

      if (ch === 64) {
        this.readPos++;
        return [new Array<any>(), true];
      } else if (ch < 95) {
        arrLen = ch - 64;
        const lenBytes: Uint8Array = this.readNBytes(5);
        if (lenBytes.byteLength === 5) {
          totalLen =
            (lenBytes[4] & 0xFF) * 16777216 +
            (lenBytes[3] & 0xFF) * 65536 +
            (lenBytes[2] & 0xFF) * 256 +
            (lenBytes[1] & 0xFF);
        }
      } else {
        const lenBytes: Uint8Array = this.readNBytes(9);
        if (lenBytes.byteLength === 9) {
          totalLen =
            (lenBytes[4] & 0xFF) * 16777216 +
            (lenBytes[3] & 0xFF) * 65536 +
            (lenBytes[2] & 0xFF) * 256 +
            (lenBytes[1] & 0xFF);
          arrLen =
            (lenBytes[8] & 0xFF) * 16777216 +
            (lenBytes[7] & 0xFF) * 65536 +
            (lenBytes[6] & 0xFF) * 256 +
            (lenBytes[5] & 0xFF);
        }
      }

      if (arrLen > 0 && totalLen > 4) {
        const ret: Array<any> = new Array<any>();

        for (let i: number = 0; i < arrLen; i++) {
          let [v, ok] = this.read();
          if (ok) {
            ret.push(v);
          } else {
            this.setReadPos(readStart);
            return [[], false];
          }
        }
        if (this.getReadPos() == readStart + totalLen) {
          return [ret, true];
        }
      }
      this.setReadPos(readStart);
    }
    return [[], false];
  }

  public readMap(): [Map<string, any>, boolean] {
    const ch: number = this.peekByte();
    if (ch >= 96 && ch < 128) {
      let mapLen: number = 0;
      let totalLen: number = 0;
      let readStart: number = this.readPos;

      if (ch == 96) {
        this.readPos++;
        return [new Map<string, any>(), true];
      } else if (ch < 127) {
        mapLen = ch - 96;
        const lenBytes: Uint8Array = this.readNBytes(5);
        if (lenBytes.byteLength === 5) {
          totalLen =
            (lenBytes[4] & 0xFF) * 16777216 +
            (lenBytes[3] & 0xFF) * 65536 +
            (lenBytes[2] & 0xFF) * 256 +
            (lenBytes[1] & 0xFF);
        }
      } else {
        const lenBytes: Uint8Array = this.readNBytes(9);
        if (lenBytes.byteLength === 9) {
          totalLen =
            (lenBytes[4] & 0xFF) * 16777216 +
            (lenBytes[3] & 0xFF) * 65536 +
            (lenBytes[2] & 0xFF) * 256 +
            (lenBytes[1] & 0xFF);
          mapLen =
            (lenBytes[8] & 0xFF) * 16777216 +
            (lenBytes[7] & 0xFF) * 65536 +
            (lenBytes[6] & 0xFF) * 256 +
            (lenBytes[5] & 0xFF);
        }
      }

      if (mapLen > 0 && totalLen > 4) {
        const ret: Map<string, any> = new Map<string, any>();

        for (let i: number = 0; i < mapLen; i++) {
          let [name, ok] = this.readString();
          if (!ok) {
            this.setReadPos(readStart);
            return [new Map<string, any>(), false];
          }
          let [value, vok] = this.read();
          if (vok) {
            ret.set(name, value);
          } else {
            this.setReadPos(readStart);
            return [new Map<string, any>(), false];
          }
        }
        if (this.getReadPos() == readStart + totalLen) {
          return [ret, true];
        }
      }
      this.setReadPos(readStart);
    }

    return [new Map<string, any>(), false];
  }

  public read(): [any, boolean] {
    const op: number = this.peekByte();

    switch (op) {
      case 1:
        return [null, this.readNull()];
      case 2:
      case 3:
        return this.readBool();
      case 4:
      case 5:
        return this.readFloat64();
      case 6:
      case 7:
      case 8:
        return this.readInt64();
      case 9:
      case 10:
      case 11:
        return this.readUint64();
      case 12:
        return [null, false];
      case 13:
        return [null, false];
      default:
        break;
    }

    switch ((op >>> 6) & 0x03) {
    case 0:
      if (op < 54) {
        return this.readInt64();
      } else {
        return this.readUint64();
      }
    case 1:
      if (op < 96) {
        return this.readArray();
      } else {
        return this.readMap();
      }
    case 2:
      return this.readString();
    default:
      return this.readBytes();
   }
  }
}
