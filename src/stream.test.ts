import {RPCStream} from "./stream";
import {isUint8ArrayEquals} from "./utils";
import {RPCFloat64} from "./types";

const testCollections: Map<string, Array<Array<any>>> = new Map([
  ["null", [
    [null, new Uint8Array([0x01])],
  ]],
  ["bool", [
    [true, new Uint8Array([0x02])],
    [false, new Uint8Array([0x03])],
  ]],
  ["float64", [
    [new RPCFloat64(0), new Uint8Array([0x04])],
    [new RPCFloat64(100), new Uint8Array([
      0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x59, 0x40,
    ])],
    [new RPCFloat64(3.1415926), new Uint8Array([
      0x05, 0x4A, 0xD8, 0x12, 0x4D, 0xFB, 0x21, 0x09, 0x40,
    ])],
    [new RPCFloat64(-3.1415926), new Uint8Array([
      0x05, 0x4A, 0xD8, 0x12, 0x4D, 0xFB, 0x21, 0x09, 0xC0,
    ])],
    [new RPCFloat64(-100), new Uint8Array([
      0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x59, 0xC0,
    ])],
  ]],
]);

describe("stream tests", () => {
  test("Start", () => {
    console.log(testCollections);
  });

  test("RPCStream_new", () => {
    const stream: RPCStream = new RPCStream();
    expect(stream.getReadPos()).toBe(17);
    expect(stream.getWritePos()).toBe(17);
    expect(isUint8ArrayEquals(
      stream.getBuffer(),
      new Uint8Array([
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]),
    )).toBe(true);
  });

  test("RPCStream_putByte", () => {
    const stream: RPCStream = new RPCStream();
    stream.setWritePos(0);

    const arr: Uint8Array = new Uint8Array(3000);
    for (let i: number = 0; i < 3000; i++) {
      arr[i] = i;
      stream.putByte(i);
    }
    expect(isUint8ArrayEquals(stream.getBuffer(), arr)).toBe(true);
  });

  test("RPCStream_putBytes", () => {
    const stream: RPCStream = new RPCStream();
    stream.setWritePos(0);

    // empty bytes
    stream.putBytes([]);
    expect(isUint8ArrayEquals(
      stream.getBuffer(),
      new Uint8Array(0),
      )).toBe(true);

    // small bytes
    stream.setWritePos(0);
    stream.putBytes([1, 2, 3]);
    expect(isUint8ArrayEquals(
      stream.getBuffer(),
      new Uint8Array([1, 2, 3]),
    )).toBe(true);

    // large bytes
    const largeNumberArr: Array<number> = [];
    for (let i: number = 0; i < 10000; i++) {
      largeNumberArr[i] = i & 0xFF;
    }
    stream.setWritePos(0);
    stream.putBytes(largeNumberArr);
    expect(isUint8ArrayEquals(
      stream.getBuffer(),
      new Uint8Array(largeNumberArr),
    )).toBe(true);
  });

  test("RPCStream_getReadPos_setReadPos", () => {
    const stream1: RPCStream = new RPCStream();
    stream1.setWritePos(0);
    expect(stream1.setReadPos(-1)).toBe(false);
    expect(stream1.getReadPos()).toBe(17);
    expect(stream1.setReadPos(1)).toBe(false);
    expect(stream1.getReadPos()).toBe(17);
    expect(stream1.setReadPos(0)).toBe(true);
    expect(stream1.getReadPos()).toBe(0);

    const stream2: RPCStream = new RPCStream();
    stream2.setWritePos(3000);
    expect(stream2.setReadPos(-1)).toBe(false);
    expect(stream2.getReadPos()).toBe(17);
    expect(stream2.setReadPos(3001)).toBe(false);
    expect(stream2.getReadPos()).toBe(17);
    expect(stream2.setReadPos(0)).toBe(true);
    expect(stream2.getReadPos()).toBe(0);
    expect(stream2.setReadPos(3000)).toBe(true);
    expect(stream2.getReadPos()).toBe(3000);
  });

  test("RPCStream_getWritePos_setWritePos", () => {
    const stream1: RPCStream = new RPCStream();
    expect(stream1.setWritePos(-1)).toBe(false);
    expect(stream1.getWritePos()).toBe(17);
    expect(stream1.setWritePos(0)).toBe(true);
    expect(stream1.getWritePos()).toBe(0);
    expect(stream1.setWritePos(10000)).toBe(true);
    expect(stream1.getWritePos()).toBe(10000);
  });

  test("RPCStream_reset", () => {
    const stream: RPCStream = new RPCStream();
    stream.setWritePos(1000);
    stream.setReadPos(800);

    stream.reset();
    expect(stream.getReadPos()).toBe(17);
    expect(stream.getWritePos()).toBe(17);
  });

  test("RPCStream_getClientCallbackID_setClientCallbackID", () => {
    const stream: RPCStream = new RPCStream();

    for (let i: number = 0; i < 10000; i++) {
      stream.setClientCallbackID(i);
      expect(stream.getClientCallbackID()).toBe(i);
    }

    for (let i: number = 60000; i < 70000; i++) {
      stream.setClientCallbackID(i);
      expect(stream.getClientCallbackID()).toBe(i);
    }

    for (let i: number = 16770000; i < 16780000; i++) {
      stream.setClientCallbackID(i);
      expect(stream.getClientCallbackID()).toBe(i);
    }

    for (let i: number = 4294957296; i <= 4294967295; i++) {
      stream.setClientCallbackID(i);
      expect(stream.getClientCallbackID()).toBe(i);
    }
  });

  test("RPCStream_writeFloat64", () => {
    for (let v of testCollections.get("float64")!) {
      const stream: RPCStream = new RPCStream();
      stream.writeFloat64(v[0]);
      expect(isUint8ArrayEquals(
        stream.getBuffer().slice(17),
        v[1],
      )).toBe(true);
    }
  });
});
