import {
  CallbackFunc,
  Logger,
  LogLevelAll,
  LogSubscription,
} from "./logger";

describe("logger tests", () => {
  beforeEach(() => {
    jest.spyOn(console, "log");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  let emptyCB: CallbackFunc = function (_: string): void {
    return;
  };
  test("LogSubscription_close", () => {
    const logger: Logger = new Logger();
    const subscription: LogSubscription = logger.subscribe();
    subscription.onDebug = emptyCB;
    subscription.onInfo = emptyCB;
    subscription.onWarn = emptyCB;
    subscription.onError = emptyCB;
    subscription.onFatal = emptyCB;
    expect(subscription.close()).toStrictEqual(true);
    expect((subscription as any).id).toStrictEqual(0);
    expect((subscription as any).logger).toBe(null);
    expect((subscription as any).onDebug).toBe(null);
    expect((subscription as any).onInfo).toBe(null);
    expect((subscription as any).onWarn).toBe(null);
    expect((subscription as any).onError).toBe(null);
    expect((subscription as any).onFatal).toBe(null);

    const subscription1: LogSubscription = logger.subscribe();
    const subscription2: LogSubscription = logger.subscribe();
    expect(subscription1.close()).toStrictEqual(true);
    expect(subscription1.close()).toStrictEqual(false);
    expect(subscription2.close()).toStrictEqual(true);

    const subscription3: LogSubscription = logger.subscribe();
    (subscription3 as any).logger = null;
    expect(subscription3.close()).toStrictEqual(false);
  });

  test("Logger_new", () => {
    const logger: Logger = new Logger();
    expect((logger as any).level).toStrictEqual(LogLevelAll);
    expect((logger as any).subscriptions.length).toStrictEqual(0);
  });

  test("Logger_setLevel", () => {
    const logMaskFatal: number = 1;
    const logMaskError: number = 2;
    const logMaskWarn: number = 4;
    const logMaskInfo: number = 8;
    const logMaskDebug: number = 16;
    const logger: Logger = new Logger();

    expect(logger.setLevel(-1)).toStrictEqual(false);
    expect((logger as any).level).toStrictEqual(LogLevelAll);

    expect(logger.setLevel(32)).toStrictEqual(false);
    expect((logger as any).level).toStrictEqual(LogLevelAll);

    expect(logger.setLevel(0)).toStrictEqual(true);
    expect((logger as any).level).toStrictEqual(0);

    expect(logger.setLevel(31)).toStrictEqual(true);
    expect((logger as any).level).toStrictEqual(31);

    // test all level and logs
    let fnTestLogLevel: (level: number) => any = (level: number): number => {
      const logger1: Logger = new Logger();
      logger1.setLevel(level);

      let ret: number = 0;
      const subscription: LogSubscription = logger1.subscribe();
      subscription.onDebug = (msg: string): void => {
        if (msg.includes("message") && msg.includes("Debug")) {
          ret += logMaskDebug;
        }
      };
      subscription.onInfo = (msg: string): void => {
        if (msg.includes("message") && msg.includes("Info")) {
          ret += logMaskInfo;
        }
      };
      subscription.onWarn = (msg: string): void => {
        if (msg.includes("message") && msg.includes("Warn")) {
          ret += logMaskWarn;
        }
      };
      subscription.onError = (msg: string): void => {
        if (msg.includes("message") && msg.includes("Error")) {
          ret += logMaskError;
        }
      };
      subscription.onFatal = (msg: string): void => {
        if (msg.includes("message") && msg.includes("Fatal")) {
          ret += logMaskFatal;
        }
      };
      logger1.debug("message");
      logger1.info("message");
      logger1.warn("message");
      logger1.error("message");
      logger1.fatal("message");
      subscription.close();
      return ret;
    };

    expect(fnTestLogLevel(-1)).toStrictEqual(31);
    for (let i: number = 0; i < 32; i++) {
      expect(fnTestLogLevel(i)).toStrictEqual(i);
    }
    expect(fnTestLogLevel(32)).toStrictEqual(31);
  });

  test("Logger_subscribe", () => {
    const logger: Logger = new Logger();
    const subscription: LogSubscription = logger.subscribe();
    expect((subscription as any).id > 0).toStrictEqual(true);
    expect((subscription as any).logger === logger)
      .toStrictEqual(true);
    expect((logger as any).subscriptions.length)
      .toStrictEqual(1);


    expect(subscription.close()).toStrictEqual(true);
    expect((subscription as any).id == 0).toStrictEqual(true);
    expect((subscription as any).logger == null)
      .toStrictEqual(true);

    expect(subscription.close()).toStrictEqual(false);

    // bug subscription
    logger.subscribe();
    const bugSubscription: LogSubscription = new LogSubscription();
    (bugSubscription as any).logger = logger;
    (bugSubscription as any).id = 234828;
    expect(bugSubscription.close()).toStrictEqual(false);
  });

  test("Logger_log", () => {
    const logger: Logger = new Logger();
    logger.subscribe();

    logger.debug("");
    expect((console.log as any).mock.calls.length).toBe(1);
    expect((console.log as any).mock.calls[0][0]).toContain("Debug");

    logger.info("");
    expect((console.log as any).mock.calls.length).toBe(2);
    expect((console.log as any).mock.calls[1][0]).toContain("Info");

    logger.warn("");
    expect((console.log as any).mock.calls.length).toBe(3);
    expect((console.log as any).mock.calls[2][0]).toContain("Warn");

    logger.error("");
    expect((console.log as any).mock.calls.length).toBe(4);
    expect((console.log as any).mock.calls[3][0]).toContain("Error");

    logger.fatal("");
    expect((console.log as any).mock.calls.length).toBe(5);
    expect((console.log as any).mock.calls[4][0]).toContain("Fatal");


    (logger as any).log(33, " Debug: ", "message");
    expect((console.log as any).mock.calls.length).toBe(6);
  });

  test("Logger_debug", () => {
    const logger: Logger = new Logger();
    logger.debug("message");
    expect((console.log as any).mock.calls.length).toBe(1);
    expect(new RegExp(
      "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}" +
      "\\+\\d{2}:\\d{2}(\\s)Debug:(\\s)message\n$",
    ).test((console.log as any).mock.calls[0][0])).toStrictEqual(true);
  });

  test("Logger_info", () => {
    const logger: Logger = new Logger();
    logger.info("message");
    expect((console.log as any).mock.calls.length).toBe(1);
    expect(new RegExp(
      "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}" +
      "\\+\\d{2}:\\d{2}(\\s)Info:(\\s)message\n$",
    ).test((console.log as any).mock.calls[0][0])).toStrictEqual(true);
  });

  test("Logger_warn", () => {
    const logger: Logger = new Logger();
    logger.warn("message");
    expect((console.log as any).mock.calls.length).toBe(1);
    expect(new RegExp(
      "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}" +
      "\\+\\d{2}:\\d{2}(\\s)Warn:(\\s)message\n$",
    ).test((console.log as any).mock.calls[0][0])).toStrictEqual(true);
  });

  test("Logger_error", () => {
    const logger: Logger = new Logger();
    logger.error("message");
    expect((console.log as any).mock.calls.length).toBe(1);
    expect(new RegExp(
      "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}" +
      "\\+\\d{2}:\\d{2}(\\s)Error:(\\s)message\n$",
    ).test((console.log as any).mock.calls[0][0])).toStrictEqual(true);
  });

  test("Logger_fatal", () => {
    const logger: Logger = new Logger();
    logger.fatal("message");
    expect((console.log as any).mock.calls.length).toBe(1);
    expect(new RegExp(
      "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d{3}" +
      "\\+\\d{2}:\\d{2}(\\s)Fatal:(\\s)message\n$",
    ).test((console.log as any).mock.calls[0][0])).toStrictEqual(true);
  });
});
