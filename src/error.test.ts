import {RPCError} from "./error";

describe("RPCError tests", () => {
  test("RPCError_new", () => {
    const v1: RPCError = new RPCError(3.5, "message", "debug");
    expect(v1.getMessage()).toStrictEqual("message");
    expect(v1.getDebug()).toStrictEqual("debug");
  });
});
