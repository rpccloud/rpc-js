// import {Logger} from "./logger";

import {Logger} from "./logger";
import {Deferred} from "./deferred";
import {RPCError, RPCInt64, RPCValue} from "./types";
import {RPCStream} from "./stream";
import {returnAsync, sleep} from "./utils";

type RPCCallBackType = [RPCValue, RPCError | null];

export
interface IRPCNetClient {
  send(data: Uint8Array): boolean;

  connect(serverURL: string): boolean;
  disconnect(): boolean;

  isConnected(): boolean;
  isClosed(): boolean;

  onOpen?: () => void;
  onBinary?: (data: Uint8Array) => void;
  onError?: (errMsg: string) => void;
  onClose?: () => void;
}

export
class WebSocketNetClient implements IRPCNetClient {
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
      this.reader =  new FileReader();
      this.reader.onload = (event?: ProgressEvent<FileReader>): void => {
        if (event && event.target && this.onBinary) {
          this.onBinary(new Uint8Array(event.target.result as ArrayBuffer));
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
  public onBinary?: (data: Uint8Array) => void;
  public onError?: (errMsg: string) => void;
  public onClose?: () => void;
}

class ClientCallbackItem {
  public readonly id: number;
  public readonly sendDeadlineMS: number;
  public readonly receiveDeadlineMS: number;
  public readonly deferred: Deferred<RPCCallBackType>;
  public readonly stream: RPCStream;
  public readonly isSend: boolean;

  public constructor(
    id: number,
    sendDeadlineMS: number,
    receiveDeadlineMS: number,
    deferred: Deferred<RPCCallBackType>,
  ) {
    this.id = id;
    this.sendDeadlineMS = sendDeadlineMS;
    this.receiveDeadlineMS = receiveDeadlineMS;
    this.deferred = deferred;
    this.stream = new RPCStream();
    this.isSend = false;
  }
}

export
class RPCClient {
  private netClient?: IRPCNetClient;
  private url: string;
  private checkTimer: any;
  private readonly checkTimerInterval: number = 1000;
  private tryConnectCount: number;
  private cbSeed: number;
  private readonly logger: Logger;
  private readonly pools: Array<ClientCallbackItem>;

  public constructor() {
    this.url = "";
    this.checkTimer = null;
    this.tryConnectCount = 0;
    this.cbSeed = 0;
    this.logger = new Logger();
    this.pools = new Array<ClientCallbackItem>();
  }

  private onConnect(): void {
    console.log(this.url + " onOpen", this.pools);
  }

  private onBinary(data: Uint8Array): void {
    console.log(this.url + " onBinary", data);
  }

  private onError(errMsg: string): void {
    console.log(this.url + " onError", errMsg);
  }

  private onDisconnect(): void {
    console.log(this.url + " onClose");
  }

  public async send(): Promise<RPCCallBackType> {
    const deferred: Deferred<RPCCallBackType> = new Deferred<RPCCallBackType>();
    // check rpc client is not open
    if (!this.checkTimer) {
      deferred.doResolve([null, new RPCError(
        "rpc-client: closed",
        "",
      )]);
      return deferred.promise;
    }

    deferred.doResolve([new RPCInt64(this.cbSeed), null]);
    return deferred.promise;
  }

  public open(url: string): boolean {
    if (this.checkTimer === null) {
      if (url.startsWith("ws") || url.startsWith("wss")) {
        this.url = url;
        this.netClient = new WebSocketNetClient(this.logger);
        this.netClient.onOpen = this.onConnect.bind(this);
        this.netClient.onBinary = this.onBinary.bind(this);
        this.netClient.onError = this.onError.bind(this);
        this.netClient.onClose = this.onDisconnect.bind(this);
      } else {
        this.netClient = undefined;
      }

      this.tryConnectCount = 0;
      this.checkConnect();

      this.checkTimer = setInterval(
        this.checkConnect.bind(this),
        this.checkTimerInterval,
      );
      return true;
    } else {
      return false;
    }
  }

  private checkConnect(): void {
    if (this.netClient && this.netClient.isConnected()) {
      this.tryConnectCount = 0;
    } else if (this.netClient && this.netClient.isClosed()) {
      if (this.tryConnectCount < 20) {
        if (
          this.tryConnectCount == 0 ||
          this.tryConnectCount == 2 ||
          this.tryConnectCount == 5 ||
          this.tryConnectCount == 9 ||
          this.tryConnectCount == 14
        ) {
          this.netClient.connect(this.url);
        }
      } else {
        if (this.tryConnectCount % 20 == 0) {
          this.netClient.connect(this.url);
        }
      }
      this.tryConnectCount++;
    } else {
      // netClient is connecting or closing, so do nothing
    }
  }

  public async close(): Promise<boolean> {
    if (this.netClient && this.checkTimer !== null) {
      clearTimeout(this.checkTimer);
      this.checkTimer = null;
      this.netClient.disconnect();
      while (!this.netClient.isClosed()) {
        await sleep(10);
      }
      this.netClient.onOpen = undefined;
      this.netClient.onBinary = undefined;
      this.netClient.onError = undefined;
      this.netClient.onClose = undefined;
      this.netClient = undefined;
      return returnAsync(true);
    } else {
      return returnAsync(false);
    }
  }
}
