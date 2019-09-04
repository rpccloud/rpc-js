import {RPCInt64, RPCUint64} from "./types";
import {isUint8ArrayEquals} from "./utils";

describe("RPCInt64 tests", () => {
  test("RPCInt64_fromBytes", () => {
    const v1 = RPCInt64.fromBytes(new Uint8Array([
      0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0xe0, 0x7f,
    ]));
    expect(v1.toNumber()).toBe(-9007199254740991);

    const v2 = RPCInt64.fromBytes(new Uint8Array([
      0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xe0, 0x7f,
    ]));
    expect(v2.toNumber()).toBe(-9007199254740990);

    const v3 = RPCInt64.fromBytes(new Uint8Array([
      0xff, 0xff, 0xff, 0x7f, 0xff, 0xff, 0xff, 0x7f,
    ]));
    expect(v3.toNumber()).toBe(-2147483649);

    const v4 = RPCInt64.fromBytes(new Uint8Array([
      0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x80,
    ]));
    expect(v4.toNumber()).toBe(2147483648);

    const v5 = RPCInt64.fromBytes(new Uint8Array([
      0xfe, 0xff, 0xff, 0xff, 0xff, 0xff, 0x1f, 0x80,
    ]));
    expect(v5.toNumber()).toBe(9007199254740990);

    const v6 = RPCInt64.fromBytes(new Uint8Array([
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x1f, 0x80,
    ]));
    expect(v6.toNumber()).toBe(9007199254740991);

    const notSafetyInt1 = RPCInt64.fromBytes(new Uint8Array([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]));
    expect(isNaN(notSafetyInt1.toNumber())).toBe(true);
    expect(isUint8ArrayEquals(
      notSafetyInt1.getBytes(),
      new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]),
    )).toBe(true);

    const notSafetyInt2 = RPCInt64.fromBytes(new Uint8Array([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xe0, 0x7f,
    ]));
    expect(isNaN(notSafetyInt2.toNumber())).toBe(true);
    expect(isUint8ArrayEquals(
      notSafetyInt2.getBytes(),
      new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xe0, 0x7f,
      ]),
    )).toBe(true);

    const notSafetyInt3 = RPCInt64.fromBytes(new Uint8Array([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x80,
    ]));
    expect(isNaN(notSafetyInt3.toNumber())).toBe(true);
    expect(isUint8ArrayEquals(
      notSafetyInt3.getBytes(),
      new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x80,
      ]),
    )).toBe(true);

    const notSafetyInt4 = RPCInt64.fromBytes(new Uint8Array([
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    ]));
    expect(isNaN(notSafetyInt4.toNumber())).toBe(true);
    expect(isUint8ArrayEquals(
      notSafetyInt4.getBytes(),
      new Uint8Array([
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      ]),
    )).toBe(true);

    const bugInt = RPCInt64.fromBytes(new Uint8Array([
      0xff, 0xff, 0xff, 0xff, 0xff,
    ]));
    expect(isNaN(bugInt.toNumber())).toBe(true);
    expect(isUint8ArrayEquals(
      bugInt.getBytes(),
      new Uint8Array(0),
    )).toBe(true);
  });
});


describe("RPCUint64 tests", () => {
  test("RPCUint64_fromBytes", () => {
    const v1 = RPCUint64.fromBytes(new Uint8Array([
      0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00,
    ]));
    expect(v1.toNumber()).toBe(4294967296);

    const v2 = RPCUint64.fromBytes(new Uint8Array([
      0xfe, 0xff, 0xff, 0xff, 0xff, 0xff, 0x1f, 0x00,
    ]));
    expect(v2.toNumber()).toBe(9007199254740990);

    const v3 = RPCUint64.fromBytes(new Uint8Array([
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x1f, 0x00,
    ]));
    expect(v3.toNumber()).toBe(9007199254740991);

    const notSafetyUint1 = RPCUint64.fromBytes(new Uint8Array([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00,
    ]));
    expect(isNaN(notSafetyUint1.toNumber())).toBe(true);
    expect(isUint8ArrayEquals(
      notSafetyUint1.getBytes(),
      new Uint8Array([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00,
      ]),
    )).toBe(true);

    const notSafetyUint2 = RPCUint64.fromBytes(new Uint8Array([
      0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    ]));
    expect(isNaN(notSafetyUint2.toNumber())).toBe(true);
    expect(isUint8ArrayEquals(
      notSafetyUint2.getBytes(),
      new Uint8Array([
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
      ]),
    )).toBe(true);

    const bugUint = RPCUint64.fromBytes(new Uint8Array([
      0xff, 0xff, 0xff, 0xff, 0xff,
    ]));
    expect(isNaN(bugUint.toNumber())).toBe(true);
    expect(isUint8ArrayEquals(
      bugUint.getBytes(),
      new Uint8Array(0),
    )).toBe(true);
  });
});
