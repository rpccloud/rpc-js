import {convertToIsoDateString} from "./utils";

export const LogLevelOff: number = 0;
export const LogLevelFatal: number = 1;
export const LogLevelError: number = 3;
export const LogLevelWarn: number = 7;
export const LogLevelInfo: number = 15;
export const LogLevelAll: number = 31;

const logMaskFatal: number = 1;
const logMaskError: number = 2;
const logMaskWarn: number = 4;
const logMaskInfo: number = 8;
const logMaskDebug: number = 16;

type CallbackFunc = ((msg: string) => void) | null;

class LogSubscription {
  private id: number;
  private logger: Logger | null;
  public onDebug: CallbackFunc;
  public onInfo: CallbackFunc;
  public onWarn: CallbackFunc;
  public onError: CallbackFunc;
  public onFatal: CallbackFunc;

  private constructor(id: number, logger: Logger) {
    this.id = id;
    this.logger = logger;
    this.onDebug = null;
    this.onInfo = null;
    this.onWarn = null;
    this.onError = null;
    this.onFatal = null;
  }

  public close(): boolean {
    if (this.logger === null || this.logger === undefined) {
      return false;
    }

    const ret: boolean = this.logger.removeSubscription(this.id);
    this.id = 0;
    this.logger = null;
    this.onDebug = null;
    this.onInfo = null;
    this.onWarn = null;
    this.onError = null;
    this.onFatal = null;

    return ret;
  }
}

class Logger {
  private level: number;
  private readonly subscriptions: Array<LogSubscription>;
  private seed: number;

  public constructor() {
    this.level = LogLevelAll;
    this.subscriptions = [];
    this.seed = 1;
  }

  public setLevel(level: number): boolean {
    if (
      Number.isInteger(level) &&
      level >= LogLevelOff && level <= LogLevelAll
    ) {
      this.level = level;
      return true;
    } else {
      return false;
    }
  }

  public removeSubscription(id: number): boolean {
    for (let i: number = 0; i < this.subscriptions.length; i++) {
      if ((this.subscriptions[i] as any).id === id) {
        this.subscriptions.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  public subscribe(): LogSubscription {
    this.seed++;
    const LogSubscriptionClass: any = LogSubscription;
    const ret: LogSubscription = new LogSubscriptionClass(this.seed, this);
    this.subscriptions.push(ret);
    return ret;
  }

  public log(outputLevel: number, tag: string, msg: string): void {
    const level: number = this.level;

    if (Number.isInteger(outputLevel) && (level & outputLevel) > 0) {
      const subscriptions: Array<LogSubscription> = this.subscriptions;
      const isoTimeNow: string = convertToIsoDateString(new Date());
      const logMsg: string = `${isoTimeNow} ${tag}: ${msg}`;

      if (subscriptions.length == 0) {
        console.log(logMsg);
      } else {
        for (let subscription of this.subscriptions) {
          let fn: CallbackFunc = null;
          switch (outputLevel) {
            case logMaskDebug:
              fn = subscription.onDebug;
              break;
            case logMaskInfo:
              fn = subscription.onInfo;
              break;
            case logMaskWarn:
              fn = subscription.onWarn;
              break;
            case logMaskError:
              fn = subscription.onError;
              break;
            case logMaskFatal:
              fn = subscription.onFatal;
              break;
            default:
              break;
          }
          if (fn != null) {
            fn(logMsg);
          } else {
            console.log(logMsg);
          }
        }
      }
    }
  }
}

