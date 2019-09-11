import {RPCStream} from "./stream";
import {RPCFloat64, RPCInt64, RPCUint64, RPCValue} from "./types";

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
    [new RPCInt64(0), new Uint8Array([0x15])],
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
    ["😀☘️🀄️©️🌈🎩", new Uint8Array([
      0x9E, 0xF0, 0x9F, 0x98, 0x80, 0xE2, 0x98, 0x98, 0xEF, 0xB8,
      0x8F, 0xF0, 0x9F, 0x80, 0x84, 0xEF, 0xB8, 0x8F, 0xC2, 0xA9,
      0xEF, 0xB8, 0x8F, 0xF0, 0x9F, 0x8C, 0x88, 0xF0, 0x9F, 0x8E,
      0xA9, 0x00,
    ])],
    ["😀中☘️文🀄️©️🌈🎩测试a\n\r\b", new Uint8Array([
      0xAE, 0xF0, 0x9F, 0x98, 0x80, 0xE4, 0xB8, 0xAD, 0xE2, 0x98,
      0x98, 0xEF, 0xB8, 0x8F, 0xE6, 0x96, 0x87, 0xF0, 0x9F, 0x80,
      0x84, 0xEF, 0xB8, 0x8F, 0xC2, 0xA9, 0xEF, 0xB8, 0x8F, 0xF0,
      0x9F, 0x8C, 0x88, 0xF0, 0x9F, 0x8E, 0xA9, 0xE6, 0xB5, 0x8B,
      0xE8, 0xAF, 0x95, 0x61, 0x0A, 0x0D, 0x08, 0x00,
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
    ["😀☘️🀄️©️🌈🎩😛👩‍👩‍👦👨‍👩‍👦‍👦👼🗣👑👚👹👺🌳🍊",
      new Uint8Array([
        0xBF, 0x6D, 0x00, 0x00, 0x00, 0xF0, 0x9F, 0x98, 0x80, 0xE2,
        0x98, 0x98, 0xEF, 0xB8, 0x8F, 0xF0, 0x9F, 0x80, 0x84, 0xEF,
        0xB8, 0x8F, 0xC2, 0xA9, 0xEF, 0xB8, 0x8F, 0xF0, 0x9F, 0x8C,
        0x88, 0xF0, 0x9F, 0x8E, 0xA9, 0xF0, 0x9F, 0x98, 0x9B, 0xF0,
        0x9F, 0x91, 0xA9, 0xE2, 0x80, 0x8D, 0xF0, 0x9F, 0x91, 0xA9,
        0xE2, 0x80, 0x8D, 0xF0, 0x9F, 0x91, 0xA6, 0xF0, 0x9F, 0x91,
        0xA8, 0xE2, 0x80, 0x8D, 0xF0, 0x9F, 0x91, 0xA9, 0xE2, 0x80,
        0x8D, 0xF0, 0x9F, 0x91, 0xA6, 0xE2, 0x80, 0x8D, 0xF0, 0x9F,
        0x91, 0xA6, 0xF0, 0x9F, 0x91, 0xBC, 0xF0, 0x9F, 0x97, 0xA3,
        0xF0, 0x9F, 0x91, 0x91, 0xF0, 0x9F, 0x91, 0x9A, 0xF0, 0x9F,
        0x91, 0xB9, 0xF0, 0x9F, 0x91, 0xBA, 0xF0, 0x9F, 0x8C, 0xB3,
        0xF0, 0x9F, 0x8D, 0x8A, 0x00,
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
    expect(stream.getBuffer())
      .toStrictEqual(new Uint8Array([
        1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]));
  });

  test("RPCStream_putByte", () => {
    const stream: RPCStream = new RPCStream();
    stream.setWritePos(0);

    const arr: Uint8Array = new Uint8Array(3000);
    for (let i: number = 0; i < 3000; i++) {
      arr[i] = i;
      (stream as any).putByte(i);
    }
    expect(stream.getBuffer()).toStrictEqual(arr);
  });

  test("RPCStream_putBytes", () => {
    const stream: RPCStream = new RPCStream();
    stream.setWritePos(0);

    // empty bytes
    (stream as any).putBytes([]);
    expect(stream.getBuffer()).toStrictEqual(new Uint8Array(0));

    // small bytes
    stream.setWritePos(0);
    (stream as any).putBytes([1, 2, 3]);
    expect(stream.getBuffer())
      .toStrictEqual(new Uint8Array([1, 2, 3]));

    // large bytes
    const largeNumberArr: Array<number> = [];
    for (let i: number = 0; i < 10000; i++) {
      largeNumberArr[i] = i & 0xFF;
    }
    stream.setWritePos(0);
    (stream as any).putBytes(largeNumberArr);
    expect(stream.getBuffer()).toStrictEqual(new Uint8Array(largeNumberArr));
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

  test("RPCStream_canRead", () => {
    const stream: RPCStream = new RPCStream();
    stream.setWritePos(1000);
    stream.setReadPos(800);
    expect(stream.canRead()).toBe(true);

    stream.setWritePos(800);
    stream.setReadPos(800);
    expect(stream.canRead()).toBe(false);

    stream.setWritePos(700);
    stream.setReadPos(800);
    expect(stream.canRead()).toBe(false);

    stream.setWritePos(2000);
    stream.setReadPos(1800);
    expect(stream.canRead()).toBe(false);
  });

  test("RPCStream_readNBytes", () => {
    const stream: RPCStream = new RPCStream();
    stream.setWritePos(1000);

    // ok
    stream.setReadPos(800);
    expect((stream as any).readNBytes(200).byteLength).toBe(200);

    // length overflow
    stream.setReadPos(800);
    expect((stream as any).readNBytes(201).byteLength).toBe(0);

    // data buffer is not init
    stream.setWritePos(2000);
    stream.setReadPos(1800);
    expect((stream as any).readNBytes(100).byteLength).toBe(0);

    // parameter error
    expect((stream as any).readNBytes(-1).byteLength).toBe(0);
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
      expect(stream.getBuffer().slice(17)).toStrictEqual(v[1]);
    }
  });

  test("RPCStream_writeBool", () => {
    for (let v of testCollections.get("bool")!) {
      const stream: RPCStream = new RPCStream();
      stream.writeBool(v[0]);
      expect(stream.getBuffer().slice(17)).toStrictEqual(v[1]);
    }

    // null
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeBool(null as any)).toBe(false);
    expect(bug1.getWritePos()).toBe(17);

    // undefined
    const bug2: RPCStream = new RPCStream();
    expect(bug2.writeBool(undefined as any)).toBe(false);
    expect(bug2.getWritePos()).toBe(17);
  });

  test("RPCStream_writeFloat64", () => {
    for (let v of testCollections.get("float64")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeFloat64(v[0])).toBe(true);
      expect(stream.getBuffer().slice(17)).toStrictEqual(v[1]);
    }

    // NaN
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeFloat64(new RPCFloat64(NaN))).toBe(false);
    expect(bug1.getWritePos()).toBe(17);

    // null
    const bug2: RPCStream = new RPCStream();
    expect(bug2.writeFloat64(null as any)).toBe(false);
    expect(bug2.getWritePos()).toBe(17);

    // undefined
    const bug3: RPCStream = new RPCStream();
    expect(bug3.writeFloat64(undefined as any)).toBe(false);
    expect(bug3.getWritePos()).toBe(17);
  });

  test("RPCStream_writeInt64", () => {
    for (let v of testCollections.get("int64")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeInt64(v[0])).toBe(true);
      expect(stream.getBuffer().slice(17)).toStrictEqual(v[1]);
    }

    // NaN
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeInt64(new RPCInt64(NaN))).toBe(false);
    expect(bug1.getWritePos()).toBe(17);

    // null
    const bug2: RPCStream = new RPCStream();
    expect(bug2.writeInt64(null as any)).toBe(false);
    expect(bug2.getWritePos()).toBe(17);

    // undefined
    const bug3: RPCStream = new RPCStream();
    expect(bug3.writeInt64(undefined as any)).toBe(false);
    expect(bug3.getWritePos()).toBe(17);
  });

  test("RPCStream_writeUint64", () => {
    for (let v of testCollections.get("uint64")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeUint64(v[0])).toBe(true);
      expect(stream.getBuffer().slice(17)).toStrictEqual(v[1]);
    }

    // NaN
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeUint64(new RPCUint64(NaN))).toBe(false);
    expect(bug1.getWritePos()).toBe(17);

    // null
    const bug2: RPCStream = new RPCStream();
    expect(bug2.writeUint64(null as any)).toBe(false);
    expect(bug2.getWritePos()).toBe(17);

    // undefined
    const bug3: RPCStream = new RPCStream();
    expect(bug3.writeUint64(undefined as any)).toBe(false);
    expect(bug3.getWritePos()).toBe(17);
  });

  test("RPCStream_writeString", () => {
    for (let v of testCollections.get("string")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeString(v[0])).toBe(true);
      expect(stream.getBuffer().slice(17)).toStrictEqual(v[1]);
    }

    // null
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeString(null as any)).toBe(false);
    expect(bug1.getWritePos()).toBe(17);

    // undefined
    const bug2: RPCStream = new RPCStream();
    expect(bug2.writeString(undefined as any)).toBe(false);
    expect(bug2.getWritePos()).toBe(17);

    // bad string
    let badString: string = String.fromCharCode(2097152);
    const bug3: RPCStream = new RPCStream();
    expect(bug3.writeString(badString)).toBe(false);
    expect(bug3.getWritePos()).toBe(17);
  });

  test("RPCStream_writeBytes", () => {
    for (let v of testCollections.get("bytes")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeBytes(v[0])).toBe(true);
      expect(stream.getBuffer().slice(17)).toStrictEqual(v[1]);
    }

    // null
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeBytes(null as any)).toBe(false);
    expect(bug1.getWritePos()).toBe(17);

    // undefined
    const bug2: RPCStream = new RPCStream();
    expect(bug2.writeBytes(null as any)).toBe(false);
    expect(bug2.getWritePos()).toBe(17);
  });

  test("RPCStream_writeArray", () => {
    for (let v of testCollections.get("array")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeArray(v[0])).toBe(true);
      expect(stream.getBuffer().slice(17)).toStrictEqual(v[1]);
    }

    // null
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeArray(null as any)).toBe(false);
    expect(bug1.getWritePos()).toBe(17);

    // undefined
    const bug2: RPCStream = new RPCStream();
    expect(bug2.writeArray(undefined as any)).toBe(false);
    expect(bug2.getWritePos()).toBe(17);

    // contain other types
    const bug3: RPCStream = new RPCStream();
    expect(bug3.writeArray([true, 1, "hi"])).toBe(false);
    expect(bug3.getWritePos()).toBe(17);
  });

  test("RPCStream_writeMap", () => {
    for (let v of testCollections.get("map")!) {
      const stream: RPCStream = new RPCStream();
      expect(stream.writeMap(v[0])).toBe(true);
      expect(stream.getBuffer().slice(17)).toStrictEqual(v[1]);
    }

    // null
    const bug1: RPCStream = new RPCStream();
    expect(bug1.writeMap(null as any)).toBe(false);
    expect(bug1.getWritePos()).toBe(17);

    // undefined
    const bug2: RPCStream = new RPCStream();
    expect(bug2.writeMap(undefined as any)).toBe(false);
    expect(bug2.getWritePos()).toBe(17);

    // contain other types
    const bug3: RPCStream = new RPCStream();
    expect(bug3.writeMap(new Map([
      ["foo", 3],
    ]))).toBe(false);
    expect(bug3.getWritePos()).toBe(17);

    // map key error
    const bug4: RPCStream = new RPCStream();
    expect(bug4.writeMap(new Map([
      [String.fromCharCode(2097152), true],
    ]))).toBe(false);
    expect(bug4.getWritePos()).toBe(17);
  });

  test("RPCStream_write", () => {
    for (let key of [
      "null", "bool", "float64", "int64", "uint64",
      "string", "bytes", "array", "map",
    ]) {
      for (let v of testCollections.get(key)!) {
        const stream: RPCStream = new RPCStream();
        expect(stream.write(v[0])).toBe(true);
        expect(stream.getBuffer().slice(17)).toStrictEqual(v[1]);
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

    // undefined
    const bug3: RPCStream = new RPCStream();
    expect(bug3.write(undefined)).toBe(false);
    expect(bug3.getWritePos()).toBe(17);
  });

  test("RPCStream_readNull", () => {
    for (let v of testCollections.get("null")!) {
      // ok
      const stream1: RPCStream = new RPCStream();
      expect(stream1.write(v[0])).toBe(true);
      expect(stream1.readNull()).toBe(true);
      expect(stream1.getWritePos()).toBe(stream1.getReadPos());

      // overflow
      const stream2: RPCStream = new RPCStream();
      expect(stream2.write(v[0])).toBe(true);
      const writePos: number = stream2.getWritePos();
      for (let idx: number = 17; idx < writePos; idx++) {
        stream2.setWritePos(idx);
        expect(stream2.readNull()).toBe(false);
        expect(stream2.getReadPos()).toBe(17);
      }

      // type not match
      const stream3: RPCStream = new RPCStream();
      (stream3 as any).putByte(13);
      expect(stream3.readNull()).toBe(false);
      expect(stream3.getReadPos()).toBe(17);
    }
  });

  test("RPCStream_readBool", () => {
    for (let v of testCollections.get("bool")!) {
      // ok
      const stream1: RPCStream = new RPCStream();
      expect(stream1.write(v[0])).toBe(true);
      expect(stream1.readBool()).toStrictEqual([v[0], true]);
      expect(stream1.getWritePos()).toBe(stream1.getReadPos());

      // overflow
      const stream2: RPCStream = new RPCStream();
      expect(stream2.write(v[0])).toBe(true);
      const writePos: number = stream2.getWritePos();
      for (let idx: number = 17; idx < writePos; idx++) {
        stream2.setWritePos(idx);
        expect(stream2.readBool()).toStrictEqual([false, false]);
        expect(stream2.getReadPos()).toBe(17);
      }

      // type not match
      const stream3: RPCStream = new RPCStream();
      (stream3 as any).putByte(13);
      expect(stream3.readBool()).toStrictEqual([false, false]);
      expect(stream3.getReadPos()).toBe(17);
    }
  });

  test("RPCStream_readFloat64", () => {
    for (let v of testCollections.get("float64")!) {
      // ok
      const stream1: RPCStream = new RPCStream();
      expect(stream1.write(v[0])).toBe(true);
      expect(stream1.readFloat64()).toStrictEqual([v[0], true]);
      expect(stream1.getWritePos()).toBe(stream1.getReadPos());

      // overflow
      const stream2: RPCStream = new RPCStream();
      expect(stream2.write(v[0])).toBe(true);
      const writePos: number = stream2.getWritePos();
      for (let idx: number = 17; idx < writePos; idx++) {
        stream2.setWritePos(idx);
        expect(stream2.readFloat64())
          .toStrictEqual([new RPCFloat64(NaN), false]);
        expect(stream2.getReadPos()).toBe(17);
      }

      // type not match
      const stream3: RPCStream = new RPCStream();
      (stream3 as any).putByte(13);
      expect(stream3.readFloat64())
        .toStrictEqual([new RPCFloat64(NaN), false]);
      expect(stream3.getReadPos()).toBe(17);
    }
  });

  test("RPCStream_readInt64", () => {
    for (let v of testCollections.get("int64")!) {
      // ok
      const stream1: RPCStream = new RPCStream();
      expect(stream1.write(v[0])).toBe(true);
      expect(stream1.readInt64()).toStrictEqual([v[0], true]);
      expect(stream1.getWritePos()).toBe(stream1.getReadPos());

      // overflow
      const stream2: RPCStream = new RPCStream();
      expect(stream2.write(v[0])).toBe(true);
      const writePos: number = stream2.getWritePos();
      for (let idx: number = 17; idx < writePos; idx++) {
        stream2.setWritePos(idx);
        expect(stream2.readInt64())
          .toStrictEqual([new RPCInt64(NaN), false]);
        expect(stream2.getReadPos()).toBe(17);
      }

      // type not match
      const stream3: RPCStream = new RPCStream();
      (stream3 as any).putByte(13);
      expect(stream3.readInt64())
        .toStrictEqual([new RPCInt64(NaN), false]);
      expect(stream3.getReadPos()).toBe(17);
    }
  });

  test("RPCStream_readUint64", () => {
    for (let v of testCollections.get("uint64")!) {
      // ok
      const stream1: RPCStream = new RPCStream();
      expect(stream1.write(v[0])).toBe(true);
      expect(stream1.readUint64()).toStrictEqual([v[0], true]);
      expect(stream1.getWritePos()).toBe(stream1.getReadPos());

      // overflow
      const stream2: RPCStream = new RPCStream();
      expect(stream2.write(v[0])).toBe(true);
      const writePos: number = stream2.getWritePos();
      for (let idx: number = 17; idx < writePos; idx++) {
        stream2.setWritePos(idx);
        expect(stream2.readUint64())
          .toStrictEqual([new RPCUint64(NaN), false]);
        expect(stream2.getReadPos()).toBe(17);
      }

      // type not match
      const stream3: RPCStream = new RPCStream();
      (stream3 as any).putByte(13);
      expect(stream3.readUint64())
        .toStrictEqual([new RPCUint64(NaN), false]);
      expect(stream3.getReadPos()).toBe(17);
    }
  });

  test("RPCStream_readString", () => {
    for (let v of testCollections.get("string")!) {
      // ok
      const stream1: RPCStream = new RPCStream();
      expect(stream1.write(v[0])).toBe(true);
      expect(stream1.readString()).toStrictEqual([v[0], true]);
      expect(stream1.getWritePos()).toBe(stream1.getReadPos());

      // overflow
      const stream2: RPCStream = new RPCStream();
      expect(stream2.write(v[0])).toBe(true);
      const writePos: number = stream2.getWritePos();
      for (let idx: number = 17; idx < writePos; idx++) {
        stream2.setWritePos(idx);
        expect(stream2.readString()).toStrictEqual(["", false]);
        expect(stream2.getReadPos()).toBe(17);
      }

      // type not match
      const stream3: RPCStream = new RPCStream();
      (stream3 as any).putByte(13);
      expect(stream3.readString()).toStrictEqual(["", false]);
      expect(stream3.getReadPos()).toBe(17);

      // read tail is not zero
      const stream4: RPCStream = new RPCStream();
      expect(stream4.write(v[0])).toBe(true);
      stream4.setWritePos(stream4.getWritePos() - 1);
      (stream4 as any).putByte(1);
      expect(stream4.readString()).toStrictEqual(["", false]);
      expect(stream4.getReadPos()).toBe(17);
    }

    // read string utf8 error
    const stream5: RPCStream = new RPCStream();
    (stream5 as any).putBytes([
      0x9E, 0xFF, 0x9F, 0x98, 0x80, 0xE2, 0x98, 0x98, 0xEF, 0xB8,
      0x8F, 0xF0, 0x9F, 0x80, 0x84, 0xEF, 0xB8, 0x8F, 0xC2, 0xA9,
      0xEF, 0xB8, 0x8F, 0xF0, 0x9F, 0x8C, 0x88, 0xF0, 0x9F, 0x8E,
      0xA9, 0x00,
    ]);
    expect(stream5.readString()).toStrictEqual(["", false]);
    expect(stream5.getReadPos()).toBe(17);

    // read string utf8 error
    const stream6: RPCStream = new RPCStream();
    (stream6 as any).putBytes([
      0xBF, 0x6D, 0x00, 0x00, 0x00, 0xFF, 0x9F, 0x98, 0x80, 0xE2,
      0x98, 0x98, 0xEF, 0xB8, 0x8F, 0xF0, 0x9F, 0x80, 0x84, 0xEF,
      0xB8, 0x8F, 0xC2, 0xA9, 0xEF, 0xB8, 0x8F, 0xF0, 0x9F, 0x8C,
      0x88, 0xF0, 0x9F, 0x8E, 0xA9, 0xF0, 0x9F, 0x98, 0x9B, 0xF0,
      0x9F, 0x91, 0xA9, 0xE2, 0x80, 0x8D, 0xF0, 0x9F, 0x91, 0xA9,
      0xE2, 0x80, 0x8D, 0xF0, 0x9F, 0x91, 0xA6, 0xF0, 0x9F, 0x91,
      0xA8, 0xE2, 0x80, 0x8D, 0xF0, 0x9F, 0x91, 0xA9, 0xE2, 0x80,
      0x8D, 0xF0, 0x9F, 0x91, 0xA6, 0xE2, 0x80, 0x8D, 0xF0, 0x9F,
      0x91, 0xA6, 0xF0, 0x9F, 0x91, 0xBC, 0xF0, 0x9F, 0x97, 0xA3,
      0xF0, 0x9F, 0x91, 0x91, 0xF0, 0x9F, 0x91, 0x9A, 0xF0, 0x9F,
      0x91, 0xB9, 0xF0, 0x9F, 0x91, 0xBA, 0xF0, 0x9F, 0x8C, 0xB3,
      0xF0, 0x9F, 0x8D, 0x8A, 0x00,
    ]);
    expect(stream6.readString()).toStrictEqual(["", false]);
    expect(stream6.getReadPos()).toBe(17);

    // read string length error
    const stream7: RPCStream = new RPCStream();
    (stream7 as any).putBytes([
      0xBF, 0x2F, 0x00, 0x00, 0x00, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x00,
    ]);
    expect(stream7.readString()).toStrictEqual(["", false]);
    expect(stream7.getReadPos()).toBe(17);
  });

  test("RPCStream_readBytes", () => {
    for (let v of testCollections.get("bytes")!) {
      // ok
      const stream1: RPCStream = new RPCStream();
      expect(stream1.write(v[0])).toBe(true);
      expect(stream1.readBytes()).toStrictEqual([v[0], true]);
      expect(stream1.getWritePos()).toBe(stream1.getReadPos());

      // overflow
      const stream2: RPCStream = new RPCStream();
      expect(stream2.write(v[0])).toBe(true);
      const writePos: number = stream2.getWritePos();
      for (let idx: number = 17; idx < writePos; idx++) {
        stream2.setWritePos(idx);
        expect(stream2.readBytes())
          .toStrictEqual([new Uint8Array([]), false]);
        expect(stream2.getReadPos()).toBe(17);
      }

      // type not match
      const stream3: RPCStream = new RPCStream();
      (stream3 as any).putByte(13);
      expect(stream3.readBytes())
        .toStrictEqual([new Uint8Array([]), false]);
      expect(stream3.getReadPos()).toBe(17);
    }

    // read bytes length error
    const stream4: RPCStream = new RPCStream();
    (stream4 as any).putBytes([
      0xFF, 0x2F, 0x00, 0x00, 0x00, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
      0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61, 0x61,
    ]);
    expect(stream4.readBytes())
      .toStrictEqual([new Uint8Array([]), false]);
    expect(stream4.getReadPos()).toBe(17);
  });

  test("RPCStream_readArray", () => {
    for (let v of testCollections.get("array")!) {
      // ok
      const stream1: RPCStream = new RPCStream();
      expect(stream1.write(v[0])).toBe(true);
      expect(stream1.readArray()).toStrictEqual([v[0], true]);
      expect(stream1.getWritePos()).toBe(stream1.getReadPos());

      // overflow
      const stream2: RPCStream = new RPCStream();
      expect(stream2.write(v[0])).toBe(true);
      const writePos: number = stream2.getWritePos();
      for (let idx: number = 17; idx < writePos; idx++) {
        stream2.setWritePos(idx);
        expect(stream2.readArray()).toStrictEqual([[], false]);
        expect(stream2.getReadPos()).toBe(17);
      }

      // type not match
      const stream3: RPCStream = new RPCStream();
      (stream3 as any).putByte(13);
      expect(stream3.readArray()).toStrictEqual([[], false]);
      expect(stream3.getReadPos()).toBe(17);

      // error in stream
      const stream4: RPCStream = new RPCStream();
      expect(stream4.write(v[0])).toBe(true);
      if ((v[0] as Array<RPCValue>).length > 0) {
        stream4.setWritePos(stream4.getWritePos() - 1);
        (stream4 as any).putByte(13);
        expect(stream4.readArray()).toStrictEqual([[], false]);
        expect(stream4.getReadPos()).toBe(17);
      }

      // error in stream
      const stream5: RPCStream = new RPCStream();
      (stream5 as any).putBytes([
        0x41, 0x07, 0x00, 0x00, 0x00, 0x02, 0x02,
      ]);
      expect(stream5.readArray()).toStrictEqual([[], false]);
      expect(stream5.getReadPos()).toBe(17);
    }
  });

  test("RPCStream_readMap", () => {
    for (let v of testCollections.get("map")!) {
      // ok
      const stream1: RPCStream = new RPCStream();
      expect(stream1.write(v[0])).toBe(true);
      expect(stream1.readMap()).toStrictEqual([v[0], true]);
      expect(stream1.getWritePos()).toBe(stream1.getReadPos());

      // overflow
      const stream2: RPCStream = new RPCStream();
      expect(stream2.write(v[0])).toBe(true);
      const writePos: number = stream2.getWritePos();
      for (let idx: number = 17; idx < writePos; idx++) {
        stream2.setWritePos(idx);
        expect(stream2.readMap())
          .toStrictEqual([new Map<string, RPCValue>(), false]);
        expect(stream2.getReadPos()).toBe(17);
      }

      // type not match
      const stream3: RPCStream = new RPCStream();
      (stream3 as any).putByte(13);
      expect(stream3.readMap())
        .toStrictEqual([new Map<string, RPCValue>(), false]);
      expect(stream3.getReadPos()).toBe(17);

      // error in stream
      const stream4: RPCStream = new RPCStream();
      expect(stream4.write(v[0])).toBe(true);
      if ((v[0] as Array<RPCValue>).length > 0) {
        stream4.setWritePos(stream4.getWritePos() - 1);
        (stream4 as any).putByte(13);
        expect(stream4.readMap())
          .toStrictEqual([new Map<string, RPCValue>(), false]);
        expect(stream4.getReadPos()).toBe(17);
      }

      // error in stream, length error
      const stream5: RPCStream = new RPCStream();
      (stream5 as any).putBytes([
        0x61, 0x0A, 0x00, 0x00, 0x00, 0x81, 0x31, 0x00, 0x02, 0x02,
      ]);
      expect(stream5.readMap())
        .toStrictEqual([new Map<string, RPCValue>(), false]);
      expect(stream5.getReadPos()).toBe(17);

      // error in stream, key error
      const stream6: RPCStream = new RPCStream();
      expect(stream1.write(v[0])).toBe(true);
      const mapSize: number = (v[0] as Map<string, RPCValue>).size;
      const wPos: number = stream6.getWritePos();
      if (mapSize > 30) {
        stream6.setWritePos(17 + 9);
        (stream6 as any).putByte(13);
        stream6.setWritePos(wPos);
        expect(stream6.readMap())
          .toStrictEqual([new Map<string, RPCValue>(), false]);
        expect(stream6.getReadPos()).toBe(17);
      } else if (mapSize > 0) {
        stream6.setWritePos(17 + 5);
        (stream6 as any).putByte(13);
        stream6.setWritePos(wPos);
        expect(stream6.readMap())
          .toStrictEqual([new Map<string, RPCValue>(), false]);
        expect(stream6.getReadPos()).toBe(17);
      }
    }
  });

  test("RPCStream_read", () => {
    for (let key of [
      "null", "bool", "float64", "int64", "uint64",
      "string", "bytes", "array", "map",
    ]) {
      for (let v of testCollections.get(key)!) {
        const stream: RPCStream = new RPCStream();
        (stream as any).putBytes(v[1]);
        expect(stream.read()).toStrictEqual([v[0], true]);
      }
    }

    const stream1: RPCStream = new RPCStream();
    (stream1 as any).putByte(12);
    expect(stream1.read()).toStrictEqual([null, false]);

    const stream2: RPCStream = new RPCStream();
    (stream2 as any).putByte(13);
    expect(stream2.read()).toStrictEqual([null, false]);
  });
});

