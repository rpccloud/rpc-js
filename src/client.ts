// import {Logger} from "./logger";

import {Logger} from "./logger";
import {Deferred} from "./deferred";

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

export
class RPCClient {
  private readonly netClient?: IRPCNetClient;
  private readonly url: string;
  private checkTimer: any;
  private readonly checkTimerInterval: number = 1000;
  private tryConnectCount: number;
  private cbSeed: number;
  private readonly logger: Logger;

  public constructor(url: string) {
    this.url = url;
    this.checkTimer = null;
    this.tryConnectCount = 0;
    this.cbSeed = 1;
    this.logger = new Logger();
    if (url.startsWith("ws") || url.startsWith("wss")) {
      this.netClient = new WebSocketNetClient(this.logger);
      this.netClient.onOpen = this.onOpen.bind(this);
      this.netClient.onBinary = this.onBinary.bind(this);
      this.netClient.onError = this.onError.bind(this);
      this.netClient.onClose = this.onClose.bind(this);
    }
  }

  private onOpen(): void {
    console.log(this.url + " onOpen");
  }

  private onBinary(data: Uint8Array): void {
    console.log(this.url + " onBinary", data);
  }

  private onError(errMsg: string): void {
    console.log(this.url + " onError", errMsg);
  }

  private onClose(): void {
    console.log(this.url + " onClose");
  }

  public async send(): Promise<any> {
    const deferred: Deferred<any> = new Deferred<any>();
    deferred.doResolve(this.cbSeed);
    return deferred.promise;
  }

  public open(): boolean {
    if (this.checkTimer === null) {
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

  public close(): boolean {
    if (this.netClient && this.checkTimer !== null) {
      clearTimeout(this.checkTimer);
      this.checkTimer = null;
      this.netClient.disconnect();
      return true;
    } else {
      return false;
    }
  }
}
