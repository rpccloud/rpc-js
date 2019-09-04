import {Ieee754} from "./ieee754";
import {RPCFloat64, RPCInt64} from "./types";

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

  // private hasNBytesToRead(n: number): boolean {
  //   return this.readPos + n <= this.writePos
  // }

  public writeNil(): void {
    this.putByte(1);
  }

  public writeBool(v: boolean): void {
    if (v) {
      this.putByte(2);
    } else {
      this.putByte(3);
    }
  }

  public writeFloat64(value: RPCFloat64): void {
    const v: number = value.toNumber();
    if (v === 0) {
      this.putByte(4);
    } else {
      this.putByte(5);
      let arr: Array<number> = [];
      Ieee754.write(arr, v, 0, true, 52, 8);
      this.putBytes(arr);
    }
  }

  public writeInt64(value: RPCInt64): void {
    let v: number = value.toNumber();
    if (v > -8 && v < 33) {
      this.putByte(v + 21);
    } else if (v >= -32768 && v < 32768) {
      this.putByte(6);
      this.putByte(v);
      this.putByte(v >>> 8);
    } else if (v >= -2147483648 && v < 2147483648) {
      this.putByte(7);
      this.putByte(v);
      v >>>= 8;
      this.putByte(v);
      v >>>= 8;
      this.putByte(v);
      this.putByte(v >>> 8);
    } else {
      this.putByte(8);
      let hi: number = v > 0 ? 0 : 0xFF;
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
      this.putByte(v >>> 8);
      this.putByte(hi);
    }
  }
}

