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
  public static readonly StatusNone: number = 0;
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
    this.status = SendItem.StatusNone;
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
        this.sendMap.get(callbackID)?.returnStream(stream);
      } else if (callbackID === 0 && sequence > 0) {
        // controlStream RequestIdsBack
        let [kind] = stream.readInt64();
        if (kind.toNumber() === controlStreamKindRequestIdsBack) {
          let [maxCallbackID] = stream.readInt64();
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
    // make client connect if not opened
    this.onCheckConnect();

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

    // wait for response
    return item.deferred.promise;
  }
}


// import {Logger} from "./logger";
//
// import {Logger} from "./logger";
// import {Deferred} from "./deferred";
// import {RPCUint64, RPCValue} from "./types";
// import {RPCError} from "./error";
// import {RPCStream} from "./stream";
// import {returnAsync, sleep} from "./utils";
//
// type RPCCallBackType = [RPCValue, RPCError | null];
//
// export interface IRPCNetClient {
//   send(data: Uint8Array): boolean;
//
//   connect(serverURL: string): boolean;
//
//   disconnect(): boolean;
//
//   isConnected(): boolean;
//
//   isClosed(): boolean;
//
//   onOpen?: () => void;
//   onStream?: (stream: RPCStream) => void;
//   onError?: (errMsg: string) => void;
//   onClose?: () => void;
// }
//
// export class WebSocketNetClient implements IRPCNetClient {
//   private webSocket?: WebSocket;
//   private reader?: FileReader;
//   private readonly logger: Logger;
//
//   public constructor(logger: Logger) {
//     this.logger = logger;
//   }
//
//   public send(data: Uint8Array): boolean {
//     if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
//       this.webSocket.send(data);
//       return true;
//     } else {
//       return false;
//     }
//   }
//
//   public connect(url: string): boolean {
//     if (this.webSocket === undefined) {
//       this.logger.info(`connecting to ${url}`);
//       this.reader = new FileReader();
//       this.reader.onload = (event?: ProgressEvent<FileReader>): void => {
//         if (event && event.target && this.onStream) {
//           const stream: RPCStream = new RPCStream();
//           stream.setWritePos(0);
//           stream.writeUint8Array(
//             new Uint8Array(event.target.result as ArrayBuffer),
//           );
//           this.onStream(stream);
//         }
//       };
//
//       this.webSocket = new WebSocket(url);
//       this.webSocket.onopen = (_: Event): void => {
//         if (this.onOpen) {
//           this.onOpen();
//         }
//       };
//       this.webSocket.onmessage = (event?: MessageEvent): void => {
//         if (this.reader && event && event.data instanceof Blob) {
//           this.reader.readAsArrayBuffer(event.data);
//         }
//       };
//       this.webSocket.onerror = (event?: Event): void => {
//         if (this.onError && event) {
//           this.onError("websocket client error");
//         }
//       };
//       this.webSocket.onclose = (_: CloseEvent): void => {
//         if (this.onClose) {
//           this.onClose();
//         }
//
//         if (this.webSocket) {
//           this.webSocket.onopen = null;
//           this.webSocket.onmessage = null;
//           this.webSocket.onerror = null;
//           this.webSocket.onclose = null;
//           this.webSocket = undefined;
//         }
//
//         if (this.reader) {
//           this.reader.onload = null;
//           this.reader = undefined;
//         }
//       };
//       return true;
//     } else {
//       return false;
//     }
//   }
//
//   public disconnect(): boolean {
//     if (this.webSocket) {
//       if (
//         this.webSocket.readyState === WebSocket.OPEN ||
//         this.webSocket.readyState === WebSocket.CONNECTING
//       ) {
//         this.webSocket.close(1000, "");
//         return true;
//       }
//     }
//     return false;
//   }
//
//   public isConnected(): boolean {
//     if (this.webSocket) {
//       return this.webSocket.readyState === WebSocket.OPEN;
//     } else {
//       return false;
//     }
//   }
//
//   public isClosed(): boolean {
//     return !this.webSocket;
//   }
//
//   public onOpen?: () => void;
//   public onStream?: (stream: RPCStream) => void;
//   public onError?: (errMsg: string) => void;
//   public onClose?: () => void;
// }
//
// class ClientCallbackItem {
//   public readonly id: number;
//   public readonly sendDeadlineMS: number;
//   public receiveDeadlineMS: number;
//   public serverTimeoutMS: number;
//   public readonly deferred: Deferred<RPCCallBackType>;
//   public readonly stream: RPCStream;
//
//   public constructor(
//     id: number,
//     sendDeadlineMS: number,
//     serverTimeoutMS: number,
//     deferred: Deferred<RPCCallBackType>,
//     stream: RPCStream,
//   ) {
//     this.id = id;
//     this.sendDeadlineMS = sendDeadlineMS;
//     this.receiveDeadlineMS = 0;
//     this.serverTimeoutMS = serverTimeoutMS;
//     this.deferred = deferred;
//     this.stream = stream;
//   }
// }
//
// function isAfterSequence(
//   baseSequence: number,
//   afterSequence: number,
// ): boolean {
//   if (Number.isInteger(baseSequence) && Number.isInteger(afterSequence)) {
//     if (
//       afterSequence > baseSequence &&
//       afterSequence - baseSequence < 100000000
//     ) {
//       return true;
//     } else if (
//       afterSequence < baseSequence &&
//       afterSequence - baseSequence + 4294967295 < 100000000
//     ) {
//       return true;
//     }
//   }
//   return false;
// }
//
// export class RPCClient {
//   private netClient?: IRPCNetClient;
//   private url: string;
//   private checkTimer: any;
//   private readonly checkTimerInterval: number = 1000;
//   private tryConnectCount: number;
//   private cbSeed: number;
//   private readonly logger: Logger;
//   private pools: Array<ClientCallbackItem>;
//   private readonly clientTimeoutMS: number;
//   private readonly serverTimeoutMS: number;
//   private serverConn: string;
//   private serverSequence: number;
//
//   public constructor() {
//     this.url = "";
//     this.checkTimer = null;
//     this.tryConnectCount = 0;
//     this.cbSeed = 1;
//     this.logger = new Logger();
//     this.pools = new Array<ClientCallbackItem>();
//
//     this.clientTimeoutMS = 15000;
//     this.serverTimeoutMS = 15000;
//
//     this.serverConn = "";
//     this.serverSequence = 0;
//   }
//
//   private onConnect(): void {
//     console.log(this.url + " onOpen", this.pools);
//   }
//
//   private onStream(stream: RPCStream): void {
//     // console.log(this.url + " onStream", stream);
//     const callbackID: number = stream.getClientCallbackID();
//
//     if (callbackID === 0) { // server stream
//       let [instruction, ok] = stream.readString();
//       if (ok && instruction === "#.connection.openInformation") {
//         let [connID, ok1] = stream.readUint64();
//         let [connSecurity, ok2] = stream.readString();
//         let [connSequence, ok3] = stream.readUint64();
//         let nConnID: number = connID.toNumber();
//         let nConnSequence: number = connSequence.toNumber();
//         if (
//           ok1 &&
//           ok2 &&
//           ok3 &&
//           nConnID < 4294967295 &&
//           nConnSequence < 4294967295
//         ) {
//           this.serverConn = `${nConnID}-${connSecurity}`;
//           if (!this.setServerSequence(nConnSequence)) {
//             // Todo: error
//           }
//         } else {
//           // Todo: error
//         }
//       }
//     } else {
//       // Todo: callback
//       let [success, ok] = stream.readBool();
//       if (ok) {
//         if (success) {
//           let [value, ok1] = stream.read();
//           if (ok1 && !stream.canRead()) {
//             this.resolveCallback(callbackID, [value, null]);
//           } else {
//             this.resolveCallback(callbackID, [null, RPCError.newTransportError(
//               "data format error",
//               "",
//             )]);
//           }
//         } else {
//           let [message, ok1] = stream.readString();
//           let [debug, ok2] = stream.readString();
//           if (ok1 && ok2 && !stream.canRead()) {
//             this.resolveCallback(callbackID, [null, new RPCError(
//               message,
//               debug,
//             )]);
//           } else {
//             this.resolveCallback(callbackID, [null, new RPCError(
//               "data format error",
//               "",
//             )]);
//           }
//         }
//       }
//     }
//   }
//
//   private onError(errMsg: string): void {
//     console.log(this.url + " onError", errMsg);
//   }
//
//   private onDisconnect(): void {
//     this.serverSequence = 0;
//   }
//
//   private getCallbackID(): number {
//     this.cbSeed++;
//     if (this.cbSeed === 4294967295) {
//       this.cbSeed = 1;
//     }
//     return this.cbSeed;
//   }
//
//   private setServerSequence(serverSequence: number): boolean {
//     if (Number.isInteger(serverSequence) && serverSequence > 0) {
//       // ok, server sequence and client sequence is fit
//       if (serverSequence === this.cbSeed) {
//         this.serverSequence = serverSequence;
//         return true;
//       } else {
//         if (!isAfterSequence(serverSequence, this.cbSeed)) {
//           return false;
//         }
//         for (let i: number = 0; i < this.pools.length; i++) {
//           if (isAfterSequence(
//             serverSequence,
//             this.pools[i].stream.getClientCallbackID(),
//           )) {
//             // (receiveDeadlineMS === 0) means item not send
//             this.pools[i].receiveDeadlineMS = 0;
//           }
//         }
//         this.checkTimeout();
//         this.serverSequence = serverSequence;
//         this.checkSend();
//         return true;
//       }
//     } else {
//       return false;
//     }
//   }
//
//   private registerCallback(
//     id: number,
//     deferred: Deferred<RPCCallBackType>,
//     stream: RPCStream,
//   ): ClientCallbackItem {
//     const ret: ClientCallbackItem = new ClientCallbackItem(
//       id,
//       new Date().getTime() + this.clientTimeoutMS,
//       this.serverTimeoutMS,
//       deferred,
//       stream,
//     );
//     this.pools.push(ret);
//     return ret;
//   }
//
//   private resolveCallback(id: number, ret: RPCCallBackType): boolean {
//     const item: ClientCallbackItem | undefined = this.pools.find(
//       o => o.id === id,
//     );
//     if (item) {
//       this.pools = this.pools.filter(o => o.id !== id);
//       item.deferred.doResolve(ret);
//       return true;
//     } else {
//       return false;
//     }
//   }
//
//   public async send(actionPath: string, ...args: Array<RPCValue>)
//     : Promise<RPCCallBackType> {
//     // check rpc client is not open
//     if (!this.checkTimer) {
//       return returnAsync([null, new RPCError(
//         "RPCClient: send: client not opened",
//         "",
//       )]);
//     }
//
//     // write the stream
//     const stream: RPCStream = new RPCStream();
//     // write target
//     if (!stream.writeString(actionPath)) {
//       return returnAsync([null, new RPCError(
//         "RPCClient: send: actionPath is not a valid string",
//         "",
//       )]);
//     }
//     // write depth (this will never failed)
//     stream.writeUint64(new RPCUint64(0));
//     // write from (this will never failed)
//     stream.writeString("@");
//     // write args
//     for (let i: number = 0; i < args.length; i++) {
//       if (!stream.write(args[i])) {
//         return returnAsync([null, new RPCError(
//           "RPCClient: send: args not supported",
//           "",
//         )]);
//       }
//     }
//
//     const id: number = this.getCallbackID();
//     stream.setClientCallbackID(id);
//     const deferred: Deferred<RPCCallBackType> = new Deferred<RPCCallBackType>();
//     this.registerCallback(id, deferred, stream);
//
//     // speed up connect if not connected
//     this.tryConnectCount = 0;
//     this.checkConnect();
//     // speed up the send
//     this.checkSend();
//     return deferred.promise;
//   }
//
//   private checkSend(): void {
//     if (
//       this.netClient &&
//       this.netClient.isConnected() &&
//       this.serverSequence > 0
//     ) {
//       for (let i: number = 0; i < this.pools.length; i++) {
//         const item: ClientCallbackItem = this.pools[i];
//         // (receiveDeadlineMS === 0) means item not send
//         if (item.receiveDeadlineMS === 0) {
//           // set the server sequence
//           item.stream.setClientConnInfo(this.serverSequence);
//           // send
//           this.netClient.send(item.stream.getBuffer());
//           // update the server sequence
//           this.serverSequence = item.stream.getClientCallbackID();
//           // mark receive deadline
//           item.receiveDeadlineMS = new Date().getTime() + item.serverTimeoutMS;
//         }
//       }
//     }
//   }
//
//   private checkTimeout(): void {
//     console.log("checkTimeout", this.cbSeed);
//   }
//
//   public open(url: string): boolean {
//     if (this.checkTimer === null) {
//       // create netClient
//       if (url.startsWith("ws") || url.startsWith("wss")) {
//         this.url = url;
//         this.netClient = new WebSocketNetClient(this.logger);
//         this.netClient.onOpen = this.onConnect.bind(this);
//         this.netClient.onStream = this.onStream.bind(this);
//         this.netClient.onError = this.onError.bind(this);
//         this.netClient.onClose = this.onDisconnect.bind(this);
//       } else {
//         this.netClient = undefined;
//       }
//
//       // start check timer
//       this.tryConnectCount = 0;
//       this.checkTimer = setInterval(() => {
//         this.checkTimeout();
//         this.checkConnect();
//         this.checkSend();
//       }, this.checkTimerInterval);
//       return true;
//     } else {
//       return false;
//     }
//   }
//
//   private checkConnect(): void {
//     if (this.netClient && this.netClient.isConnected()) {
//       this.tryConnectCount = 0;
//     } else if (this.netClient && this.netClient.isClosed()) {
//       if (this.pools.length > 0) {
//         if (this.tryConnectCount < 15) {
//           if (
//             this.tryConnectCount == 0 ||
//             this.tryConnectCount == 2 ||
//             this.tryConnectCount == 5 ||
//             this.tryConnectCount == 10
//           ) {
//             this.netClient.connect(
//               this.url + `?conn=${this.serverConn}`,
//             );
//           }
//         } else {
//           // average 10 time unit, add random to reduce server concurrency
//           if (this.tryConnectCount % 15 === 0) {
//             this.tryConnectCount += Math.floor(Math.random() * 10);
//             this.netClient.connect(
//               this.url + `?conn=${this.serverConn}`,
//             );
//           }
//         }
//       } else {
//         // average 20 time unit, add random to reduce server concurrency
//         if (this.tryConnectCount % 30 === 0) {
//           this.tryConnectCount += Math.floor(Math.random() * 20);
//           this.netClient.connect(
//             this.url + `?conn=${this.serverConn}`,
//           );
//         }
//       }
//
//       this.tryConnectCount++;
//     } else {
//       // netClient is connecting or closing, so do nothing
//     }
//   }
//
//   public async close(): Promise<boolean> {
//     if (this.checkTimer !== null) {
//       // clear check timer
//       clearTimeout(this.checkTimer);
//       this.checkTimer = null;
//
//       // clear netClient
//       if (this.netClient) {
//         this.netClient.disconnect();
//         while (!this.netClient.isClosed()) {
//           await sleep(10);
//         }
//         this.netClient.onOpen = undefined;
//         this.netClient.onStream = undefined;
//         this.netClient.onError = undefined;
//         this.netClient.onClose = undefined;
//         this.netClient = undefined;
//       }
//       return returnAsync(true);
//     } else {
//       return returnAsync(false);
//     }
//   }
// }
