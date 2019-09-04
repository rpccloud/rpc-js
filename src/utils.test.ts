import {isUint8ArrayEquals} from "./utils";

describe("utils tests", () => {
  test("isUint8ArrayEquals", () => {
    expect(isUint8ArrayEquals(
      new Uint8Array(10),
      new Uint8Array(10),
    )).toBe(true);

    expect(isUint8ArrayEquals(
      new Uint8Array(10),
      new Uint8Array(12),
    )).toBe(false);

    const arr0 = new Uint8Array(10);
    const arr1 = new Uint8Array(10);
    arr0[8] = 36
    expect(isUint8ArrayEquals(arr0,  arr1)).toBe(false);
  });


});
