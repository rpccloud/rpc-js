import {RPCStream} from "./stream";
import {RPCError} from "./error";

const websocketCloseNormalClosure: number = 1000;

export interface IStreamConn {
  onReceiveStream: ((stream: RPCStream) => void) | null;

  sendStream(stream: RPCStream): RPCError | null;

  close(): RPCError | null;
}

export interface IClientAdapter {
  open(
    onConnOpen: (conn: IStreamConn) => void,
    onConnClose: (conn: IStreamConn) => void,
    onError: (err: RPCError) => void,
  ): void;

  close(onError: (err: RPCError) => void): void;

  getConn(): IStreamConn | null;

  isClosed(): boolean;
}

export class WebSocketStreamConn implements IStreamConn {
  private readonly ws: WebSocket;
  public onReceiveStream: ((stream: RPCStream) => void) | null = null;

  public constructor(ws: WebSocket) {
    ws.onmessage = this.onMessage.bind(this);
    this.ws = ws;
  }

  private onMessage(event?: MessageEvent): void {
    console.log(event?.data);
    if (this.onReceiveStream != null) {
      this.onReceiveStream(new RPCStream());
    }
  }

  public sendStream(stream: RPCStream): RPCError | null {
    this.ws.send(stream.getBuffer());
    return null;
  }

  public close(): RPCError | null {
    this.ws.close(websocketCloseNormalClosure);
    return null;
  }
}

export class WSClientAdapter implements IClientAdapter {
  private static StatusOpening: number = 1;
  private static StatusOpened: number = 2;
  private static StatusClosing: number = 3;
  private static StatusClosed: number = 4;

  private ws: WebSocket | null = null;
  private conn: IStreamConn | null = null;
  private readonly connectString: string;
  private status: number;

  public constructor(connectString: string) {
    this.connectString = connectString;
    this.status = WSClientAdapter.StatusClosed;
  }

  public getConn(): IStreamConn | null {
    return this.conn;
  }

  public open(
    onConnOpen: (conn: IStreamConn) => void,
    onConnClose: (conn: IStreamConn) => void,
    onError: (err: RPCError) => void,
  ): void {
    if (this.status === WSClientAdapter.StatusClosed) {
      this.status = WSClientAdapter.StatusOpening;
      console.log(this.connectString);
      let ws: WebSocket = new WebSocket(this.connectString);
      this.ws = ws;
      let conn: IStreamConn = new WebSocketStreamConn(ws);
      ws.binaryType = "arraybuffer";
      ws.onopen = () => {
        this.conn = conn;
        this.status = WSClientAdapter.StatusOpened;
        onConnOpen(conn);
      };
      ws.onclose = () => {
        onConnClose(conn);
        this.status = WSClientAdapter.StatusClosed;
        this.conn = null;
        this.ws = null;
      };
      ws.onerror = (ev: Event) => {
        onError(RPCError.newTransportError(ev.type));
        ws.close(websocketCloseNormalClosure);
      };
    }
  }

  public close(onError: (err: RPCError) => void): void {
    if (this.status === WSClientAdapter.StatusOpening
      || this.status === WSClientAdapter.StatusOpened) {
      if (this.ws != null) {
        this.status = WSClientAdapter.StatusClosing;
        this.ws.close(websocketCloseNormalClosure);
      }
    } else {
      onError(RPCError.newKernelPanic("it is not running"));
    }
  }

  public isClosed(): boolean {
    return this.status === WSClientAdapter.StatusClosed;
  }
}
