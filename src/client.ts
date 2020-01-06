// import {Logger} from "./logger";

import { Logger } from "./logger";
import { Deferred } from "./deferred";
import { RPCError, RPCUint64, RPCValue } from "./types";
import { RPCStream } from "./stream";
import { returnAsync, sleep } from "./utils";

type RPCCallBackType = [RPCValue, RPCError | null];

export interface IRPCNetClient {
  send(data: Uint8Array): boolean;

  connect(serverURL: string): boolean;
  disconnect(): boolean;

  isConnected(): boolean;
  isClosed(): boolean;

  onOpen?: () => void;
  onStream?: (stream: RPCStream) => void;
  onError?: (errMsg: string) => void;
  onClose?: () => void;
}

export class WebSocketNetClient implements IRPCNetClient {
  private webSocket?: WebSocket;
  private reader?: FileReader;
  private readonly logger: Logger;

  public constructor(logger: Logger) {
    this.logger = logger;
  }

  public send(data: Uint8Array): boolean {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(data);
      return true;
    } else {
      return false;
    }
  }

  public connect(url: string): boolean {
    if (this.webSocket === undefined) {
      this.logger.info(`connecting to ${url}`);
      this.reader = new FileReader();
      this.reader.onload = (event?: ProgressEvent<FileReader>): void => {
        if (event && event.target && this.onStream) {
          const stream: RPCStream = new RPCStream();
          stream.setWritePos(0);
          stream.writeUint8Array(
            new Uint8Array(event.target.result as ArrayBuffer),
          );
          this.onStream(stream);
        }
      };

      this.webSocket = new WebSocket(url);
      this.webSocket.onopen = (_: Event): void => {
        if (this.onOpen) {
          this.onOpen();
        }
      };
      this.webSocket.onmessage = (event?: MessageEvent): void => {
        if (this.reader && event && event.data instanceof Blob) {
          this.reader.readAsArrayBuffer(event.data);
        }
      };
      this.webSocket.onerror = (event?: Event): void => {
        if (this.onError && event) {
          this.onError("websocket client error");
        }
      };
      this.webSocket.onclose = (_: CloseEvent): void => {
        if (this.onClose) {
          this.onClose();
        }

        if (this.webSocket) {
          this.webSocket.onopen = null;
          this.webSocket.onmessage = null;
          this.webSocket.onerror = null;
          this.webSocket.onclose = null;
          this.webSocket = undefined;
        }

        if (this.reader) {
          this.reader.onload = null;
          this.reader = undefined;
        }
      };
      return true;
    } else {
      return false;
    }
  }

  public disconnect(): boolean {
    if (this.webSocket) {
      if (
        this.webSocket.readyState === WebSocket.OPEN ||
        this.webSocket.readyState === WebSocket.CONNECTING
      ) {
        this.webSocket.close(1000, "");
        return true;
      }
    }
    return false;
  }

  public isConnected(): boolean {
    if (this.webSocket) {
      return this.webSocket.readyState === WebSocket.OPEN;
    } else {
      return false;
    }
  }

  public isClosed(): boolean {
    return !this.webSocket;
  }

  public onOpen?: () => void;
  public onStream?: (stream: RPCStream) => void;
  public onError?: (errMsg: string) => void;
  public onClose?: () => void;
}

class ClientCallbackItem {
  public readonly id: number;
  public readonly sendDeadlineMS: number;
  public receiveDeadlineMS: number;
  public serverTimeoutMS: number;
  public readonly deferred: Deferred<RPCCallBackType>;
  public readonly stream: RPCStream;

  public constructor(
    id: number,
    sendDeadlineMS: number,
    serverTimeoutMS: number,
    deferred: Deferred<RPCCallBackType>,
    stream: RPCStream,
  ) {
    this.id = id;
    this.sendDeadlineMS = sendDeadlineMS;
    this.receiveDeadlineMS = 0;
    this.serverTimeoutMS = serverTimeoutMS;
    this.deferred = deferred;
    this.stream = stream;
  }
}

function isAfterSequence(
  baseSequence: number,
  afterSequence: number,
): boolean {
  if (Number.isInteger(baseSequence) && Number.isInteger(afterSequence)) {
    if (
      afterSequence > baseSequence &&
      afterSequence - baseSequence < 100000000
    ) {
      return true;
    } else if (
      afterSequence < baseSequence &&
      afterSequence - baseSequence + 4294967295 < 100000000
    ) {
      return true;
    }
  }
  return false;
}

export class RPCClient {
  private netClient?: IRPCNetClient;
  private url: string;
  private checkTimer: any;
  private readonly checkTimerInterval: number = 1000;
  private tryConnectCount: number;
  private cbSeed: number;
  private readonly logger: Logger;
  private pools: Array<ClientCallbackItem>;
  private readonly clientTimeoutMS: number;
  private readonly serverTimeoutMS: number;
  private serverConn: string;
  private serverSequence: number;

  public constructor() {
    this.url = "";
    this.checkTimer = null;
    this.tryConnectCount = 0;
    this.cbSeed = 1;
    this.logger = new Logger();
    this.pools = new Array<ClientCallbackItem>();

    this.clientTimeoutMS = 15000;
    this.serverTimeoutMS = 15000;

    this.serverConn = "";
    this.serverSequence = 0;
  }

  private onConnect(): void {
    console.log(this.url + " onOpen", this.pools);
  }

  private onStream(stream: RPCStream): void {
    // console.log(this.url + " onStream", stream);
    const callbackID: number = stream.getClientCallbackID();

    if (callbackID === 0) { // server stream
      let [instruction, ok] = stream.readString();
      if (ok && instruction === "#.connection.openInformation") {
        let [connID, ok1] = stream.readUint64();
        let [connSecurity, ok2] = stream.readString();
        let [connSequence, ok3] = stream.readUint64();
        let nConnID: number = connID.toNumber();
        let nConnSequence: number = connSequence.toNumber();
        if (
          ok1 &&
          ok2 &&
          ok3 &&
          nConnID < 4294967295 &&
          nConnSequence < 4294967295
        ) {
          this.serverConn = `${nConnID}-${connSecurity}`;
          if (!this.setServerSequence(nConnSequence)) {
            // Todo: error
          }
        } else {
          // Todo: error
        }
      }
    } else {
      // Todo: callback
      let [success, ok] = stream.readBool();
      if (ok) {
        if (success) {
          let [value, ok1] = stream.read();
          if (ok1 && !stream.canRead()) {
            this.resolveCallback(callbackID, [value, null]);
          } else {
            this.resolveCallback(callbackID, [null, new RPCError(
              "data format error",
              "",
            )]);
          }
        } else {
          let [message, ok1] = stream.readString();
          let [debug, ok2] = stream.readString();
          if (ok1 && ok2 && !stream.canRead()) {
            this.resolveCallback(callbackID, [null, new RPCError(
              message,
              debug,
            )]);
          } else {
            this.resolveCallback(callbackID, [null, new RPCError(
              "data format error",
              "",
            )]);
          }
        }
      }
    }
  }

  private onError(errMsg: string): void {
    console.log(this.url + " onError", errMsg);
  }

  private onDisconnect(): void {
    this.serverSequence = 0;
  }

  private getCallbackID(): number {
    this.cbSeed++;
    if (this.cbSeed === 4294967295) {
      this.cbSeed = 1;
    }
    return this.cbSeed;
  }

  private setServerSequence(serverSequence: number): boolean {
    if (Number.isInteger(serverSequence) && serverSequence > 0) {
      // ok, server sequence and client sequence is fit
      if (serverSequence === this.cbSeed) {
        this.serverSequence = serverSequence;
        return true;
      } else {
        if (!isAfterSequence(serverSequence, this.cbSeed)) {
          return false;
        }
        for (let i: number = 0; i < this.pools.length; i++) {
          if (isAfterSequence(
            serverSequence,
            this.pools[i].stream.getClientCallbackID(),
          )) {
            // (receiveDeadlineMS === 0) means item not send
            this.pools[i].receiveDeadlineMS = 0;
          }
        }
        this.checkTimeout();
        this.serverSequence = serverSequence;
        this.checkSend();
        return true;
      }
    } else {
      return false;
    }
  }

  private registerCallback(
    id: number,
    deferred: Deferred<RPCCallBackType>,
    stream: RPCStream,
  ): ClientCallbackItem {
    const ret: ClientCallbackItem = new ClientCallbackItem(
      id,
      new Date().getTime() + this.clientTimeoutMS,
      this.serverTimeoutMS,
      deferred,
      stream,
    );
    this.pools.push(ret);
    return ret;
  }

  private resolveCallback(id: number, ret: RPCCallBackType): boolean {
    const item: ClientCallbackItem | undefined = this.pools.find(
      o => o.id === id,
    );
    if (item) {
      this.pools = this.pools.filter(o => o.id !== id);
      item.deferred.doResolve(ret);
      return true;
    } else {
      return false;
    }
  }

  public async send(actionPath: string, ...args: Array<RPCValue>)
    : Promise<RPCCallBackType> {
    // check rpc client is not open
    if (!this.checkTimer) {
      return returnAsync([null, new RPCError(
        "RPCClient: send: client not opened",
        "",
      )]);
    }

    // write the stream
    const stream: RPCStream = new RPCStream();
    // write target
    if (!stream.writeString(actionPath)) {
      return returnAsync([null, new RPCError(
        "RPCClient: send: actionPath is not a valid string",
        "",
      )]);
    }
    // write depth (this will never failed)
    stream.writeUint64(new RPCUint64(0));
    // write from (this will never failed)
    stream.writeString("@");
    // write args
    for (let i: number = 0; i < args.length; i++) {
      if (!stream.write(args[i])) {
        return returnAsync([null, new RPCError(
          "RPCClient: send: args not supported",
          "",
        )]);
      }
    }

    const id: number = this.getCallbackID();
    stream.setClientCallbackID(id);
    const deferred: Deferred<RPCCallBackType> = new Deferred<RPCCallBackType>();
    this.registerCallback(id, deferred, stream);

    // speed up connect if not connected
    this.tryConnectCount = 0;
    this.checkConnect();
    // speed up the send
    this.checkSend();
    return deferred.promise;
  }

  private checkSend(): void {
    if (
      this.netClient &&
      this.netClient.isConnected() &&
      this.serverSequence > 0
    ) {
      for (let i: number = 0; i < this.pools.length; i++) {
        const item: ClientCallbackItem = this.pools[i];
        // (receiveDeadlineMS === 0) means item not send
        if (item.receiveDeadlineMS === 0) {
          // set the server sequence
          item.stream.setClientConnInfo(this.serverSequence);
          // send
          this.netClient.send(item.stream.getBuffer());
          // update the server sequence
          this.serverSequence = item.stream.getClientCallbackID();
          // mark receive deadline
          item.receiveDeadlineMS = new Date().getTime() + item.serverTimeoutMS;
        }
      }
    }
  }

  private checkTimeout(): void {
    console.log("checkTimeout", this.cbSeed);
  }

  public open(url: string): boolean {
    if (this.checkTimer === null) {
      // create netClient
      if (url.startsWith("ws") || url.startsWith("wss")) {
        this.url = url;
        this.netClient = new WebSocketNetClient(this.logger);
        this.netClient.onOpen = this.onConnect.bind(this);
        this.netClient.onStream = this.onStream.bind(this);
        this.netClient.onError = this.onError.bind(this);
        this.netClient.onClose = this.onDisconnect.bind(this);
      } else {
        this.netClient = undefined;
      }

      // start check timer
      this.tryConnectCount = 0;
      this.checkTimer = setInterval(() => {
        this.checkTimeout();
        this.checkConnect();
        this.checkSend();
      }, this.checkTimerInterval);
      return true;
    } else {
      return false;
    }
  }

  private checkConnect(): void {
    if (this.netClient && this.netClient.isConnected()) {
      this.tryConnectCount = 0;
    } else if (this.netClient && this.netClient.isClosed()) {
      if (this.pools.length > 0) {
        if (this.tryConnectCount < 15) {
          if (
            this.tryConnectCount == 0 ||
            this.tryConnectCount == 2 ||
            this.tryConnectCount == 5 ||
            this.tryConnectCount == 10
          ) {
            this.netClient.connect(
              this.url + `?conn=${this.serverConn}`,
            );
          }
        } else {
          // average 10 time unit, add random to reduce server concurrency
          if (this.tryConnectCount % 15 === 0) {
            this.tryConnectCount += Math.floor(Math.random() * 10);
            this.netClient.connect(
              this.url + `?conn=${this.serverConn}`,
            );
          }
        }
      } else {
        // average 20 time unit, add random to reduce server concurrency
        if (this.tryConnectCount % 30 === 0) {
          this.tryConnectCount += Math.floor(Math.random() * 20);
          this.netClient.connect(
            this.url + `?conn=${this.serverConn}`,
          );
        }
      }

      this.tryConnectCount++;
    } else {
      // netClient is connecting or closing, so do nothing
    }
  }

  public async close(): Promise<boolean> {
    if (this.checkTimer !== null) {
      // clear check timer
      clearTimeout(this.checkTimer);
      this.checkTimer = null;

      // clear netClient
      if (this.netClient) {
        this.netClient.disconnect();
        while (!this.netClient.isClosed()) {
          await sleep(10);
        }
        this.netClient.onOpen = undefined;
        this.netClient.onStream = undefined;
        this.netClient.onError = undefined;
        this.netClient.onClose = undefined;
        this.netClient = undefined;
      }
      return returnAsync(true);
    } else {
      return returnAsync(false);
    }
  }
}
