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
      this.netClient.onOpen = () => {
        this.onOpen();
      };
      this.netClient.onBinary = (data: Uint8Array) => {
        this.onBinary(data);
      };
      this.netClient.onError = (errMsg: string) => {
        this.onError(errMsg);
      };
      this.netClient.onClose = () => {
        this.onClose();
      };
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

      this.checkTimer = setInterval(() => {
        if (this.netClient && this.netClient.isConnected()) {
          this.timeIndex = 0;
        } else if (this.netClient && this.netClient.isClosed()) {
          if (this.timeIndex < 60) {
            if (
              this.timeIndex == 0 ||
              this.timeIndex == 2 ||
              this.timeIndex == 5 ||
              this.timeIndex == 8 ||
              this.timeIndex == 15 ||
              this.timeIndex == 30
            ) {
              this.netClient.connect(this.url);
            }
          } else {
            if (this.timeIndex % 30 == 0) {
              this.netClient.connect(this.url);
            }
          }
          this.timeIndex++;
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
