import { Deferred } from "./deferred";

describe("deferred tests", () => {
  test("Deferred_new", async () => {
    const deferred1: Deferred<any> = new Deferred<any>();
    expect((deferred1 as any).promise).toBeTruthy();
    expect((deferred1 as any).resolve).toBeTruthy();
    expect((deferred1 as any).promise).toBeTruthy();
  });

  test("Deferred_doResolve", async () => {
    const deferred1: Deferred<any> = new Deferred<any>();
    expect(deferred1.doResolve(5)).toBe(true);
    expect(await deferred1.promise).toBe(5);

    const deferred2: Deferred<any> = new Deferred<any>();
    setTimeout(() => {
      expect(deferred2.doResolve(6)).toBe(true);
    }, 50);
    expect(await deferred2.promise).toBe(6);

    // promise chan
    const deferred3: Deferred<any> = new Deferred<any>();
    const deferred4: Deferred<any> = new Deferred<any>();
    setTimeout(() => {
      expect(deferred3.doResolve(deferred4.promise)).toBe(true);
    }, 30);
    setTimeout(() => {
      expect(deferred4.doResolve(10)).toBe(true);
    }, 50);
    expect(await deferred3.promise).toBe(10);

    // deferred is done
    expect(deferred1.doResolve(10)).toBe(false);
  });

  test("Deferred_doReject", async () => {
    const deferred1: Deferred<any> = new Deferred<any>();
    expect(deferred1.doReject("reject")).toBe(true);
    try {
      await deferred1.promise;
      expect(true).toStrictEqual(false);
    } catch (e) {
      expect(e).toStrictEqual("reject");
    }

    const deferred2: Deferred<any> = new Deferred<any>();
    setTimeout(() => {
      expect(deferred2.doReject("reject")).toBe(true);
    }, 50);
    try {
      await deferred2.promise;
      expect(true).toStrictEqual(false);
    } catch (e) {
      expect(e).toStrictEqual("reject");
    }

    // deferred is done
    expect(deferred1.doReject("reject")).toBe(false);
  });
});
