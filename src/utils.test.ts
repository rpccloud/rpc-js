import {stringToUTF8, utf8ToString} from "./utils";

describe("utils tests", () => {
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

