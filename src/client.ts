import {Deferred} from "./deferred";
import {RPCAny, toRPCInt64, toRPCUint64} from "./types";
import {RPCError} from "./error";
import {RPCStream} from "./stream";
import {getTimeNowMS} from "./utils";
import {
  IStreamConn,
  IClientAdapter,
  WSClientAdapter,
} from "./adapter_websocket";

const errStringBadStream: string = "bad stream";
const errStringTimeout: string = "timeout";

const controlStreamKindInit: number = 1;
const controlStreamKindInitBack: number = 2;
const controlStreamKindRequestIds: number = 3;
const controlStreamKindRequestIdsBack: number = 4;

class SendItem {
  public static readonly StatusRunning: number = 1;
  public static readonly StatusFinish: number = 2;

  public id: number;
  private status: number;
  public startMS: number;
  public sendMS: number;
  public timeoutMS: number;
  public readonly deferred: Deferred<RPCAny>;
  public readonly stream: RPCStream;
  public next: SendItem | null;

  public constructor() {
    this.id = 0;
    this.status = SendItem.StatusRunning;
    this.startMS = 0;
    this.sendMS = 0;
    this.timeoutMS = 0;
    this.deferred = new Deferred<RPCAny>();
    this.stream = new RPCStream();
    this.next = null;
  }

  public returnStream(stream: RPCStream): boolean {
    if (this.status !== SendItem.StatusRunning) {
      return false;
    }

    this.status = SendItem.StatusFinish;

    let [errKind, ok] = stream.readUint64();
    if (!ok) {
      this.deferred.doReject(RPCError.newProtocolError(errStringBadStream));
      return true;
    }

    let errCode: number = errKind.toNumber();
    switch (errCode) {
      case RPCError.KindNone:
        let [value, ok1] = stream.read();
        if (ok1 && stream.isReadFinish()) {
          this.deferred.doResolve(value);
        } else {
          this.deferred.doReject(RPCError.newProtocolError(errStringBadStream));
        }
        break;
      case RPCError.KindProtocol:
      case RPCError.KindTransport:
      case RPCError.KindReply:
      case RPCError.KindReplyPanic:
      case RPCError.KindRuntimePanic:
      case RPCError.KindKernelPanic:
      case RPCError.KindSecurityLimit:
        let [message, ok2] = stream.readString();
        let [debug, ok3] = stream.readString();
        if (ok2 && ok3 && stream.isReadFinish()) {
          this.deferred.doReject(new RPCError(errCode, message, debug));
        } else {
          this.deferred.doReject(RPCError.newProtocolError(errStringBadStream));
        }
        break;
      default:
        this.deferred.doReject(RPCError.newProtocolError(errStringBadStream));
        break;
    }
    return true;
  }

  public returnTimeout(): boolean {
    if (this.status === SendItem.StatusRunning) {
      this.status = SendItem.StatusFinish;
      this.deferred.doReject(RPCError.newReplyError(errStringTimeout));
      return true;
    } else {
      return false;
    }
  }
}


export class RPCClient {
  private isRunning: boolean;

  private sessionString: string;
  private preSendHead: SendItem | null = null;
  private preSendTail: SendItem | null = null;
  private sendMap: Map<number, SendItem> = new Map();
  private systemSeed: number = 0;
  private readTimeoutMS: number = 0;
  // private writeTimeoutMS: number = 0;
  // private readLimit: number = 0;
  private currCallbackID: number = 0;
  private maxCallbackID: number = 0;
  private callbackSize: number = 0;
  private lastControlSendTimeMS: number = 0;
  private lastTimeoutCheckTimeMS: number = 0;
  private readonly connectString: string;

  private conn: IStreamConn | null = null;
  private readonly adapter: IClientAdapter | null;
  private readonly timerCheckConnect: number;
  private readonly timerCheckRunning: number;

  public constructor(connectString: string) {
    this.isRunning = true;
    this.sessionString = "";
    this.connectString = connectString;

    console.log(new URL(connectString).protocol);
    switch (new URL(connectString).protocol) {
      case "ws:":
        this.adapter = new WSClientAdapter(connectString);
        break;
      default:
        this.adapter = null;
        break;
    }

    this.timerCheckConnect = window.setInterval(
      this.onCheckConnect.bind(this),
      1000,
    );
    this.timerCheckRunning = window.setInterval(
      this.onCheckRunning.bind(this),
      200,
    );
  }

  private initConn(stream: RPCStream): RPCError | null {
    if (stream.getCallbackID() !== 0) {
      return RPCError.newProtocolError(errStringBadStream);
    }

    if (stream.getSequence() !== this.systemSeed) {
      return RPCError.newProtocolError(errStringBadStream);
    }

    let [kind] = stream.readInt64();
    if (kind.toNumber() != controlStreamKindInitBack) {
      return RPCError.newProtocolError(errStringBadStream);
    }

    let [sessionString, ok1] = stream.readString();
    if (!ok1 || sessionString === null || sessionString.length < 34) {
      return RPCError.newProtocolError(errStringBadStream);
    }

    let [readTimeout] = stream.readInt64();
    if (!(readTimeout.toNumber() > 0)) {
      return RPCError.newProtocolError(errStringBadStream);
    }

    let [writeTimeout] = stream.readInt64();
    if (!(writeTimeout.toNumber() > 0)) {
      return RPCError.newProtocolError(errStringBadStream);
    }

    let [readLimit] = stream.readInt64();
    if (!(readLimit.toNumber() > 0)) {
      return RPCError.newProtocolError(errStringBadStream);
    }

    let [callBackSize] = stream.readInt64();
    if (!(callBackSize.toNumber() > 0)) {
      return RPCError.newProtocolError(errStringBadStream);
    }

    if (!stream.isReadFinish()) {
      return RPCError.newProtocolError(errStringBadStream);
    }

    this.sessionString = sessionString;
    this.readTimeoutMS = readTimeout.toNumber();
    // this.writeTimeoutMS = writeTimeout.toNumber();
    // this.readLimit = readLimit.toNumber();
    this.callbackSize = callBackSize.toNumber();
    return null;
  }

  private tryToTimeout(nowMS: number): void {
    if (nowMS - this.lastTimeoutCheckTimeMS > 800) {
      this.lastTimeoutCheckTimeMS = nowMS;

      // sweep pre send list
      let preValidItem: SendItem | null = null;
      let item: SendItem | null = this.preSendHead;
      while (item != null) {
        if (nowMS - item.startMS > item.timeoutMS && item.returnTimeout()) {
          let nextItem: SendItem | null = item.next;

          if (preValidItem == null) {
            this.preSendHead = nextItem;
          } else {
            preValidItem.next = nextItem;
          }

          if (item === this.preSendTail) {
            this.preSendTail = preValidItem;
            if (this.preSendTail !== null) {
              this.preSendTail.next = null;
            }
          }
          item = nextItem;
        } else {
          preValidItem = item;
          item = item.next;
        }
      }

      // sweep send map
      this.sendMap.forEach((value: SendItem, key: number) => {
        if (nowMS - value.startMS > value.timeoutMS && value.returnTimeout()) {
          this.sendMap.delete(key);
        }
      });
    }
  }

  private getHeartbeatMS(): number {
    return this.readTimeoutMS * 0.8;
  }

  private tryToDeliverControlMessage(nowMS: number): void {
    if (this.conn == null) {
      return;
    }

    let deltaMS: number = nowMS - this.lastControlSendTimeMS;

    if (deltaMS < 1000) {
      return;
    } else if (deltaMS < this.getHeartbeatMS()
      && this.sendMap.size > this.callbackSize / 2) {
      return;
    } else {
      this.lastControlSendTimeMS = nowMS;
      let stream: RPCStream = new RPCStream();

      stream.setCallbackID(0);
      this.systemSeed++;
      stream.setSequence(this.systemSeed);
      stream.writeInt64(toRPCInt64(controlStreamKindRequestIds));
      stream.writeUint64(toRPCUint64(this.currCallbackID));

      this.sendMap.forEach((_: SendItem, key: number) => {
        stream.writeUint64(toRPCUint64(key));
      });

      let err: RPCError | null = this.conn.sendStream(stream);
      if (err != null) {
        this.onError(err);
      }
    }
  }

  private tryToDeliverPreSendMessage(): boolean {
    // not connected
    if (this.conn == null) {
      return false;
    }

    // preSend queue is empty
    if (this.preSendHead == null) {
      return false;
    }

    // id is not available
    if (this.currCallbackID >= this.maxCallbackID) {
      return false;
    }

    // get and set the send item
    let item: SendItem | null = this.preSendHead;
    if (item == this.preSendTail) {
      this.preSendHead = null;
      this.preSendTail = null;
    } else {
      this.preSendHead = this.preSendHead.next;
    }
    this.currCallbackID++;
    item.id = this.currCallbackID;
    item.next = null;
    item.stream.setCallbackID(item.id);
    item.stream.setSequence(0);

    // set to sendMap
    this.sendMap.set(item.id, item);

    // try to send
    let err: RPCError | null = this.conn.sendStream(item.stream);

    if (err != null) {
      this.onError(err);
      return false;
    } else {
      item.sendMS = getTimeNowMS();
      return true;
    }
  }

  private onCheckConnect(): void {
    if (this.adapter == null) {
      this.onError(RPCError.newRuntimePanic(
        "error connectString " + this.connectString,
      ));
      return;
    }

    if (this.adapter.isClosed()) {
      this.adapter.open(
        (conn: IStreamConn) => {
          conn.onReceiveStream = this.onReceiveStream.bind(this);
          let sendStream: RPCStream = new RPCStream();
          sendStream.setCallbackID(0);
          this.systemSeed++;
          sendStream.setSequence(this.systemSeed);
          sendStream.writeInt64(toRPCInt64(controlStreamKindInit));
          sendStream.writeString(this.sessionString);
          let err: RPCError | null = conn.sendStream(sendStream);
          if (err != null) {
            this.onError(err);
            conn.close();
          }
        },
        (conn: IStreamConn) => {
          conn.onReceiveStream = null;
          if (conn === this.conn) {
            this.conn = null;
          }
        },
        this.onError.bind(this),
      );
    }
  }

  private onCheckRunning(): void {
    if (this.conn !== null) {
      let nowMS: number = getTimeNowMS();
      this.tryToTimeout(nowMS);
      this.tryToDeliverControlMessage(nowMS);
      while (this.tryToDeliverPreSendMessage()) {
        // loop until failed
      }
    }
  }

  private onReceiveStream(conn: IStreamConn, stream: RPCStream): void {
    if (this.conn === null) {
      // if conn is null, we can only accept initBack stream
      const err: RPCError | null = this.initConn(stream);
      if (err !== null) {
        this.onError(err);
        conn.close();
      } else {
        this.conn = conn;
      }
    } else {
      const callbackID: number = stream.getCallbackID();
      const sequence: number = stream.getSequence();

      if (callbackID > 0) {
        // data stream
        if (this.sendMap.get(callbackID)?.returnStream(stream) === true) {
          this.sendMap.delete(callbackID);
        }
      } else if (callbackID === 0 && sequence > 0) {
        // controlStream RequestIdsBack
        let [kind] = stream.readInt64();
        if (kind.toNumber() === controlStreamKindRequestIdsBack) {
          let [maxCallbackID] = stream.readUint64();
          if (maxCallbackID.toNumber() > this.maxCallbackID) {
            this.maxCallbackID = maxCallbackID.toNumber();
          }
        }
      } else {
        // broadcast stream
        console.log("not implement broadcast message");
      }
    }
  }

  public close(): boolean {
    if (this.isRunning) {
      this.isRunning = false;
      window.clearInterval(this.timerCheckConnect);
      window.clearInterval(this.timerCheckRunning);
      this.adapter?.close(this.onError.bind(this));
      return true;
    } else {
      this.onError(RPCError.newRuntimePanic("it is not running"));
      return false;
    }
  }

  public onError(err: RPCError): void {
    console.log(err);
  }

  public async send(timeoutMS: number, target: string, ...args: Array<RPCAny>)
    : Promise<RPCAny> {
    // create SendItem
    let item: SendItem = new SendItem();
    item.startMS = getTimeNowMS();
    item.timeoutMS = timeoutMS;

    // write target
    item.stream.writeString(target);
    // write depth
    item.stream.writeUint64(toRPCUint64(0));
    // write from
    item.stream.writeString("@");
    // write args
    for (let i: number = 0; i < args.length; i++) {
      let errCode: number = item.stream.write(args[i]);
      switch (errCode) {
        case RPCStream.UnsupportedType:
          item.deferred.doReject(RPCError.newReplyError(
            `client: send: ${args[i]} type is not supported`,
          ));
          break;
        case RPCStream.WriteOverflow:
          item.deferred.doReject(RPCError.newReplyError(
            `client: send: ${args[i]} value is overflow`,
          ));
          break;
        default:
          break;
      }
    }

    // add item to the list tail
    if (this.preSendTail == null) {
      this.preSendHead = item;
      this.preSendTail = item;
    } else {
      this.preSendTail.next = item;
      this.preSendTail = item;
    }

    // speed up
    this.onCheckConnect();
    this.onCheckRunning();
    // wait for response
    return item.deferred.promise;
  }
}
