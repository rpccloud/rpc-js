import {Ieee754} from "./ieee754";
import {RPCFloat64, RPCInt64, RPCUint64} from "./types";
import {stringToUTF8} from "./utils";

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

  public putByte(value: number): void {
    this.enlarge(this.writePos + 1);
    this.data[this.writePos] = value;
    this.writePos++;
  }

  public putBytes(value: Array<number>): void {
    this.enlarge(this.writePos + value.length);
    for (let n of value) {
      this.data[this.writePos] = n;
      this.writePos++;
    }
  }

  public putUint8Bytes(value: Uint8Array): void {
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
        } else {
          return false;
        }
      default:
        return false;
    }
  }
}
