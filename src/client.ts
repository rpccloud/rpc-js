// const CONNECTING: number = 0;
// const OPEN: number = 1;
// const CLOSING: number = 2;
// const CLOSED: number = 3;

export interface IRPCNetClient {
  send(data: Uint8Array): boolean;

  connect(serverURL: string): boolean;
  disconnect(): boolean;

  isConnected(): boolean;
  isClosed(): boolean;

  onOpen?: (netClient: IRPCNetClient) => void;
  onBinary?: (netClient: IRPCNetClient, data: Uint8Array) => boolean;
  onError?: (netClient: IRPCNetClient, errMsg: string) => void;
  onClose?: (netClient: IRPCNetClient) => void;
}

class WebSocketNetClient implements IRPCNetClient {
  private webSocket?: WebSocket;
  private reader?: FileReader;

  public send(data: Uint8Array): boolean {
    console.log("send ", data);
    return false;
  }

  public connect(url: string): boolean {
    let me: WebSocketNetClient = this;
    this.reader =  new FileReader();
    this.reader.onload = (event?: ProgressEvent<FileReader>): void => {
      if (event && event.target && me.onBinary) {
        me.onBinary(me, new Uint8Array(event.target.result as ArrayBuffer));
      }
    };

    this.webSocket = new WebSocket(url);
    this.webSocket.onopen = (_: Event): void => {
      if (me.onOpen) {
        me.onOpen(this);
      }
    };
    this.webSocket.onmessage = (event?: MessageEvent): void => {
      if (me.reader && event && event.data instanceof Blob) {
        me.reader.readAsArrayBuffer(event.data);
      }
    };
    this.webSocket.onerror = (event?: Event): void => {
      if (me.onError && event) {
        me.onError(me, event.toString());
      }
    };
    this.webSocket.onclose = (_: CloseEvent): void => {
      if (me.onClose) {
        me.onClose(me);
      }
    };
    return false;
  }

  public disconnect(): boolean {
    if (this.webSocket) {
      this.webSocket.close();
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

  public onOpen?: (netClient: IRPCNetClient) => void;
  public onBinary?: (netClient: IRPCNetClient, data: Uint8Array) => boolean;
  public onError?: (netClient: IRPCNetClient, errMsg: string) => void;
  public onClose?: (netClient: IRPCNetClient) => void;
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
    }
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
