import {isUint8ArrayEquals, stringToUTF8, utf8ToString} from "./utils";

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

    const arr0: Uint8Array = new Uint8Array(10);
    const arr1: Uint8Array = new Uint8Array(10);
    arr0[8] = 36;
    expect(isUint8ArrayEquals(arr0,  arr1)).toBe(false);
  });

  test("stringToUTF8_utf8ToString", () => {
    expect(utf8ToString(new Uint8Array(stringToUTF8(
      "a",
    )))).toStrictEqual([
      "a",
      true,
    ]);

    expect(utf8ToString(new Uint8Array(stringToUTF8(
      "测试",
    )))).toStrictEqual([
      "测试",
      true,
    ]);

    expect(utf8ToString(new Uint8Array(stringToUTF8(
      "😀中☘️文🀄️©️🌈🎩测𝌆试a\n\r\b",
    )))).toStrictEqual([
      "😀中☘️文🀄️©️🌈🎩测𝌆试a\n\r\b",
      true,
    ]);
  });
});

