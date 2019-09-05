import {RPCStream} from "./stream";
import {isUint8ArrayEquals} from "./utils";
import {RPCFloat64, RPCInt64, RPCUint64} from "./types";

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
  ["int64", [
    // -9223372036854775808
    [RPCInt64.fromBytes(new Uint8Array([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ])), new Uint8Array([
      0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ])],
    // -9007199254740992
    [RPCInt64.fromBytes(new Uint8Array([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xE0, 0x7F,
    ])), new Uint8Array([
      0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xE0, 0x7F,
    ])],
    [new RPCInt64(-9007199254740991), new Uint8Array([
      0x08, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0xE0, 0x7F,
    ])],
    [new RPCInt64(-9007199254740990), new Uint8Array([
      0x08, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xE0, 0x7F,
    ])],
    [new RPCInt64(-2147483649), new Uint8Array([
      0x08, 0xFF, 0xFF, 0xFF, 0x7F, 0xFF, 0xFF, 0xFF, 0x7F,
    ])],
    [new RPCInt64(-2147483648), new Uint8Array([
      0x07, 0x00, 0x00, 0x00, 0x00,
    ])],
    [new RPCInt64(-32769), new Uint8Array([
      0x07, 0xFF, 0x7F, 0xFF, 0x7F,
    ])],
    [new RPCInt64(-32768), new Uint8Array([
      0x06, 0x00, 0x00,
    ])],
    [new RPCInt64(-8), new Uint8Array([
      0x06, 0xF8, 0x7F,
    ])],
    [new RPCInt64(-7), new Uint8Array([0x0E])],
    [new RPCInt64(-1), new Uint8Array([0x14])],
    [new RPCInt64(-0), new Uint8Array([0x15])],
    [new RPCInt64(1), new Uint8Array([0x16])],
    [new RPCInt64(32), new Uint8Array([0x35])],
    [new RPCInt64(33), new Uint8Array([
      0x06, 0x21, 0x80,
    ])],
    [new RPCInt64(32767), new Uint8Array([
      0x06, 0xFF, 0xFF,
    ])],
    [new RPCInt64(32768), new Uint8Array([
      0x07, 0x00, 0x80, 0x00, 0x80,
    ])],
    [new RPCInt64(2147483647), new Uint8Array([
      0x07, 0xFF, 0xFF, 0xFF, 0xFF,
    ])],
    [new RPCInt64(2147483648), new Uint8Array([
      0x08, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x80,
    ])],
    [new RPCInt64(9007199254740990), new Uint8Array([
      0x08, 0xFE, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x1F, 0x80,
    ])],
    [new RPCInt64(9007199254740991), new Uint8Array([
      0x08, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x1F, 0x80,
    ])],
    // 9007199254740992
    [RPCInt64.fromBytes(new Uint8Array([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x80,
    ])), new Uint8Array([
      0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x80,
    ])],
    // 9223372036854775807
    [RPCInt64.fromBytes(new Uint8Array([
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    ])), new Uint8Array([
      0x08, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    ])],
  ]],
  ["uint64", [
    [new RPCUint64(0), new Uint8Array([0x36])],
    [new RPCUint64(9), new Uint8Array([0x3F])],
    [new RPCUint64(10), new Uint8Array([
      0x09, 0x0A, 0x00,
    ])],
    [new RPCUint64(65535), new Uint8Array([
      0x09, 0xFF, 0xFF,
    ])],
    [new RPCUint64(65536), new Uint8Array([
      0x0A, 0x00, 0x00, 0x01, 0x00,
    ])],
    [new RPCUint64(4294967295), new Uint8Array([
      0x0A, 0xFF, 0xFF, 0xFF, 0xFF,
    ])],
    [new RPCUint64(4294967296), new Uint8Array([
      0x0B, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00,
    ])],
    [new RPCUint64(9007199254740990), new Uint8Array([
      0x0B, 0xFE, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x1F, 0x00,
    ])],
    [new RPCUint64(9007199254740991), new Uint8Array([
      0x0B, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x1F, 0x00,
    ])],
    // 9007199254740992
    [RPCUint64.fromBytes(new Uint8Array([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00,
    ])), new Uint8Array([
      0x0B, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00,
    ])],
    // 18446744073709551615
    [RPCUint64.fromBytes(new Uint8Array([
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    ])), new Uint8Array([
      0x0B, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
    ])],
  ]],
  ["string", [
    ["", new Uint8Array([0x80])],
    ["a", new Uint8Array([
      0x81, 0x61, 0x00,
    ])],
    ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      new Uint8Array([
        0xBF, 0x3F, 0x00, 0x00, 0x00, 0x61, 0x61, 0x61, 0x61, 0x61,
        0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
        0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
        0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
        0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
        0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
        0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x00,
      ])],
    ["😀中☘️文🀄️©️🌈🎩测试a\n\r\b", new Uint8Array([
      0xAE, 0xF0, 0x9F, 0x98, 0x80, 0xE4, 0xB8, 0xAD, 0xE2, 0x98,
      0x98, 0xEF, 0xB8, 0x8F, 0xE6, 0x96, 0x87, 0xF0, 0x9F, 0x80,
      0x84, 0xEF, 0xB8, 0x8F, 0xC2, 0xA9, 0xEF, 0xB8, 0x8F, 0xF0,
      0x9F, 0x8C, 0x88, 0xF0, 0x9F, 0x8E, 0xA9, 0xE6, 0xB5, 0x8B,
      0xE8, 0xAF, 0x95, 0x61, 0x0A, 0x0D, 0x08, 0x00,
    ])],
  ]],
  ["bytes", [
    [new Uint8Array([]), new Uint8Array([
      0xC0,
    ])],
    [new Uint8Array([0xDA]), new Uint8Array([
      0xC1, 0xDA,
    ])],
    [new Uint8Array([
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61,
    ]), new Uint8Array([
      0xFF, 0x3F, 0x00, 0x00, 0x00, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
    ])],
  ]],
  ["array", [
    [[], new Uint8Array([64])],
    [[true], new Uint8Array([
      65, 6, 0, 0, 0, 2,
    ])],
    [[true, false], new Uint8Array([
      66, 7, 0, 0, 0, 2, 3,
    ])],
    [[
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true, true, true,
    ], new Uint8Array([
      94, 35, 0, 0, 0, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 2,
    ])],
    [[
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true, true, true,
      true,
    ], new Uint8Array([
      95, 40, 0, 0, 0, 31, 0, 0, 0, 2,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    ])],
    [[
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true, true, true,
      true, true,
    ], new Uint8Array([
      95, 41, 0, 0, 0, 32, 0, 0, 0, 2,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2,
    ])],
  ]],
  ["map", [
    [new Map([]), new Uint8Array([0x60])],
    [new Map([
      ["1", true],
    ]), new Uint8Array([
      0x61, 0x09, 0x00, 0x00, 0x00, 0x81, 0x31, 0x00, 0x02,
    ])],
    [new Map([
      ["1", true], ["2", true], ["3", true], ["4", true],
      ["5", true], ["6", true], ["7", true], ["8", true],
      ["9", true], ["a", true], ["b", true], ["c", true],
      ["d", true], ["e", true], ["f", true], ["g", true],
      ["h", true], ["i", true], ["j", true], ["k", true],
      ["l", true], ["m", true], ["n", true], ["o", true],
      ["p", true], ["q", true], ["r", true], ["s", true],
      ["t", true], ["u", true],
    ]), new Uint8Array([
      0x7E, 0x7D, 0x00, 0x00, 0x00, 0x81, 0x31, 0x00, 0x02, 0x81,
      0x32, 0x00, 0x02, 0x81, 0x33, 0x00, 0x02, 0x81, 0x34, 0x00,
      0x02, 0x81, 0x35, 0x00, 0x02, 0x81, 0x36, 0x00, 0x02, 0x81,
      0x37, 0x00, 0x02, 0x81, 0x38, 0x00, 0x02, 0x81, 0x39, 0x00,
      0x02, 0x81, 0x61, 0x00, 0x02, 0x81, 0x62, 0x00, 0x02, 0x81,
      0x63, 0x00, 0x02, 0x81, 0x64, 0x00, 0x02, 0x81, 0x65, 0x00,
      0x02, 0x81, 0x66, 0x00, 0x02, 0x81, 0x67, 0x00, 0x02, 0x81,
      0x68, 0x00, 0x02, 0x81, 0x69, 0x00, 0x02, 0x81, 0x6A, 0x00,
      0x02, 0x81, 0x6B, 0x00, 0x02, 0x81, 0x6C, 0x00, 0x02, 0x81,
      0x6D, 0x00, 0x02, 0x81, 0x6E, 0x00, 0x02, 0x81, 0x6F, 0x00,
      0x02, 0x81, 0x70, 0x00, 0x02, 0x81, 0x71, 0x00, 0x02, 0x81,
      0x72, 0x00, 0x02, 0x81, 0x73, 0x00, 0x02, 0x81, 0x74, 0x00,
      0x02, 0x81, 0x75, 0x00, 0x02,
    ])],
    [new Map([
      ["1", true], ["2", true], ["3", true], ["4", true],
      ["5", true], ["6", true], ["7", true], ["8", true],
      ["9", true], ["a", true], ["b", true], ["c", true],
      ["d", true], ["e", true], ["f", true], ["g", true],
      ["h", true], ["i", true], ["j", true], ["k", true],
      ["l", true], ["m", true], ["n", true], ["o", true],
      ["p", true], ["q", true], ["r", true], ["s", true],
      ["t", true], ["u", true], ["v", true],
    ]), new Uint8Array([
      0x7F, 0x85, 0x00, 0x00, 0x00, 0x1F, 0x00, 0x00, 0x00, 0x81,
      0x31, 0x00, 0x02, 0x81, 0x32, 0x00, 0x02, 0x81, 0x33, 0x00,
      0x02, 0x81, 0x34, 0x00, 0x02, 0x81, 0x35, 0x00, 0x02, 0x81,
      0x36, 0x00, 0x02, 0x81, 0x37, 0x00, 0x02, 0x81, 0x38, 0x00,
      0x02, 0x81, 0x39, 0x00, 0x02, 0x81, 0x61, 0x00, 0x02, 0x81,
      0x62, 0x00, 0x02, 0x81, 0x63, 0x00, 0x02, 0x81, 0x64, 0x00,
      0x02, 0x81, 0x65, 0x00, 0x02, 0x81, 0x66, 0x00, 0x02, 0x81,
      0x67, 0x00, 0x02, 0x81, 0x68, 0x00, 0x02, 0x81, 0x69, 0x00,
      0x02, 0x81, 0x6A, 0x00, 0x02, 0x81, 0x6B, 0x00, 0x02, 0x81,
      0x6C, 0x00, 0x02, 0x81, 0x6D, 0x00, 0x02, 0x81, 0x6E, 0x00,
      0x02, 0x81, 0x6F, 0x00, 0x02, 0x81, 0x70, 0x00, 0x02, 0x81,
      0x71, 0x00, 0x02, 0x81, 0x72, 0x00, 0x02, 0x81, 0x73, 0x00,
      0x02, 0x81, 0x74, 0x00, 0x02, 0x81, 0x75, 0x00, 0x02, 0x81,
      0x76, 0x00, 0x02,
    ])],
  ]],
]);

describe("stream tests", () => {
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
      (stream as any).putByte(i);
    }
    expect(isUint8ArrayEquals(stream.getBuffer(), arr)).toBe(true);
  });

  test("RPCStream_putBytes", () => {
    const stream: RPCStream = new RPCStream();
    stream.setWritePos(0);

    // empty bytes
    (stream as any).putBytes([]);
    expect(isUint8ArrayEquals(
      stream.getBuffer(),
      new Uint8Array(0),
      )).toBe(true);

    // small bytes
    stream.setWritePos(0);
    (stream as any).putBytes([1, 2, 3]);
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
    (stream as any).putBytes(largeNumberArr);
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

  test("RPCStream_writeNull", () => {
    for (let v of testCollections.get("null")!) {
      const stream: RPCStream = new RPCStream();
      stream.writeNull();
      expect(isUint8ArrayEquals(
        stream.getBuffer().slice(17),
        v[1],
      )).toBe(true);
    }
  });

  test("RPCStream_writeBool", () => {
    for (let v of testCollections.get("bool")!) {
      const stream: RPCStream = new RPCStream();
      stream.writeBool(v[0]);
      expect(isUint8ArrayEquals(
        stream.getBuffer().slice(17),
        v[1],
      )).toBe(true);
    }
  });

  test("RPCStream_writeFloat64", () => {
    for (let v of testCollections.get("float64")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeFloat64(v[0])).toBe(true);
      expect(isUint8ArrayEquals(
        stream.getBuffer().slice(17),
        v[1],
      )).toBe(true);
    }

    // NaN
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeFloat64(new RPCFloat64(NaN))).toBe(false);
    expect(bug1.getWritePos()).toBe(17);
  });

  test("RPCStream_writeInt64", () => {
    for (let v of testCollections.get("int64")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeInt64(v[0])).toBe(true);
      expect(isUint8ArrayEquals(
        stream.getBuffer().slice(17),
        v[1],
      )).toBe(true);
    }

    // NaN
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeInt64(new RPCInt64(NaN))).toBe(false);
    expect(bug1.getWritePos()).toBe(17);
  });

  test("RPCStream_writeUint64", () => {
    for (let v of testCollections.get("uint64")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeUint64(v[0])).toBe(true);
      expect(isUint8ArrayEquals(
        stream.getBuffer().slice(17),
        v[1],
      )).toBe(true);
    }

    // NaN
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeUint64(new RPCUint64(NaN))).toBe(false);
    expect(bug1.getWritePos()).toBe(17);
  });

  test("RPCStream_writeString", () => {
    for (let v of testCollections.get("string")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeString(v[0])).toBe(true);
      expect(isUint8ArrayEquals(
        stream.getBuffer().slice(17),
        v[1],
      )).toBe(true);
    }

    // null
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeString(null as any)).toBe(false);
    expect(bug1.getWritePos()).toBe(17);

    // bad string
    let badString: string = String.fromCharCode(2097152);
    const bug2: RPCStream = new RPCStream();
    expect(bug2.writeString(badString)).toBe(false);
    expect(bug2.getWritePos()).toBe(17);
  });

  test("RPCStream_writeBytes", () => {
    for (let v of testCollections.get("bytes")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeBytes(v[0])).toBe(true);
      expect(isUint8ArrayEquals(
        stream.getBuffer().slice(17),
        v[1],
      )).toBe(true);
    }

    // null
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeBytes(null as any)).toBe(false);
    expect(bug1.getWritePos()).toBe(17);
  });

  test("RPCStream_writeArray", () => {
    for (let v of testCollections.get("array")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeArray(v[0])).toBe(true);
      expect(isUint8ArrayEquals(
        stream.getBuffer().slice(17),
        v[1],
      )).toBe(true);
    }

    // null
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeArray(null as any)).toBe(false);
    expect(bug1.getWritePos()).toBe(17);

    // contain other types
    const bug2: RPCStream = new RPCStream();
    expect(bug2.writeArray([true, 1, "hi"])).toBe(false);
    expect(bug2.getWritePos()).toBe(17);
  });

  test("RPCStream_writeMap", () => {
    for (let v of testCollections.get("map")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeMap(v[0])).toBe(true);
      expect(isUint8ArrayEquals(
        stream.getBuffer().slice(17),
        v[1],
      )).toBe(true);
    }

    // null
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeMap(null as any)).toBe(false);
    expect(bug1.getWritePos()).toBe(17);

    // contain other types
    const bug2: RPCStream = new RPCStream();
    expect(bug2.writeMap(new Map([
      ["foo", 3],
    ]))).toBe(false);
    expect(bug2.getWritePos()).toBe(17);

    // map key error
    const bug3: RPCStream = new RPCStream();
    expect(bug3.writeMap(new Map([
      [String.fromCharCode(2097152), true],
    ]))).toBe(false);
    expect(bug3.getWritePos()).toBe(17);
  });

  test("RPCStream_write", () => {
    for (let key of [
      "null", "bool", "float64", "int64", "uint64",
      "string", "bytes", "array", "map",
    ]) {
      for (let v of testCollections.get(key)!) {
        const stream: RPCStream = new RPCStream();
        expect(stream.write(v[0])).toBe(true);
        expect(isUint8ArrayEquals(
          stream.getBuffer().slice(17),
          v[1],
        )).toBe(true);
      }
    }

    // other unsupported object type
    const bug1: RPCStream = new RPCStream();
    expect(bug1.write(new Date())).toBe(false);
    expect(bug1.getWritePos()).toBe(17);

    // unsupported number type
    const bug2: RPCStream = new RPCStream();
    expect(bug2.write(1)).toBe(false);
    expect(bug2.getWritePos()).toBe(17);
  });
});
