// import {Logger} from "./logger";

export interface IRPCNetClient {
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

class WebSocketNetClient implements IRPCNetClient {
  private webSocket?: WebSocket;
  private reader?: FileReader;
  // private logger: Logger = new Logger();

  public send(data: Uint8Array): boolean {
    console.log("send ", data);
    return false;
  }

  public connect(url: string): boolean {
    if (this.webSocket === undefined) {
      let me: WebSocketNetClient = this;
      this.reader =  new FileReader();
      this.reader.onload = (event?: ProgressEvent<FileReader>): void => {
        if (event && event.target && me.onBinary) {
          me.onBinary(new Uint8Array(event.target.result as ArrayBuffer));
        }
      };

      this.webSocket = new WebSocket(url);
      this.webSocket.onopen = (_: Event): void => {
        if (me.onOpen) {
          me.onOpen();
        }
      };
      this.webSocket.onmessage = (event?: MessageEvent): void => {
        if (me.reader && event && event.data instanceof Blob) {
          me.reader.readAsArrayBuffer(event.data);
        }
      };
      this.webSocket.onerror = (event?: Event): void => {
        if (me.onError && event) {
          me.onError(event.toString());
        }
      };
      this.webSocket.onclose = (_: CloseEvent): void => {
        if (me.onClose) {
          me.onClose();
        }
        me.webSocket = undefined;
        me.reader = undefined;
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
    if (this.webSocket) {
      return this.webSocket.readyState === WebSocket.CLOSED;
    } else {
      return false;
    }
  }

  public onOpen?: () => void;
  public onBinary?: (data: Uint8Array) => void;
  public onError?: (errMsg: string) => void;
  public onClose?: () => void;
}

export class RPCClient {
  private readonly netClient?: IRPCNetClient;
  private readonly url: string;
  private checkTimer: any;
  private timeIndex: number;

  public constructor(url: string) {
    this.url = url;
    this.checkTimer = null;
    this.timeIndex = 0;
    if (url.startsWith("ws") || url.startsWith("wss")) {
      this.netClient = new WebSocketNetClient();
      this.netClient.onOpen = this.onOpen;
      this.netClient.onBinary = this.onBinary;
      this.netClient.onError = this.onError;
      this.netClient.onClose = this.onClose;
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

  public open(): boolean {
    if (this.checkTimer === null) {
      this.timeIndex = 0;
      if (this.netClient) {
        this.netClient.connect(this.url);
      }
      let me: RPCClient = this;
      this.checkTimer = setInterval(() => {
        if (me.netClient && me.netClient.isConnected()) {
          me.timeIndex = 0;
        } else if (me.netClient && me.netClient.isClosed()) {
          if (me.timeIndex < 60) {
            if (
              me.timeIndex == 0 ||
              me.timeIndex == 2 ||
              me.timeIndex == 5 ||
              me.timeIndex == 8 ||
              me.timeIndex == 15 ||
              me.timeIndex == 30
            ) {
              me.netClient.connect(me.url);
            }
          } else {
            if (me.timeIndex % 30 == 0) {
              me.netClient.connect(me.url);
            }
          }
          me.timeIndex++;
        } else {
          // netClient is connecting or closing, so do nothing
        }
      }, 1000);
      return true;
    } else {
      return false;
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
