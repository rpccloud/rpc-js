import * as WebSocket from "ws";
import {Deferred} from "./deferred";
import {WebSocketNetClient} from "./client";
import {Logger} from "./logger";
import {sleep} from "./utils";

async function runWebSocketServer(
  port: number,
  fn: (server: WebSocket.Server, logger: Logger) => Promise<any>,
  ): Promise<any> {
  const deferred: Deferred<any> = new Deferred<any>();

  const wss: WebSocket.Server = new WebSocket.Server({ port: port });
  const logger: Logger = new Logger();

  wss.on("connection", async (ws: WebSocket) => {
    logger.info("connection onopen");

    ws.onmessage = (event: WebSocket.MessageEvent) => {
      logger.info(`connection onmessage ${(event.data as Buffer).length}`);
      ws.send(event.data);
      ws.send("string type message to client");
    };

    ws.onerror = (event: WebSocket.ErrorEvent) => {
      logger.info("connection onerror " + event.message);
    };

    ws.onclose = (_: WebSocket.CloseEvent) => {
      logger.info("connection onclose");
    };
  });

  await sleep(80);
  await fn(wss, logger);
  await sleep(80);

  wss.close((_?: Error) => {
    deferred.doResolve(true);
  });

  return deferred.promise;
}

describe("WebSocketNetClient tests", () => {
  beforeEach(() => {
    jest.setTimeout(200000);
    jest.spyOn(console, "log");
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.setTimeout(5000);
  });

  test("WebSocketNetClient_new", async () => {
    const client: WebSocketNetClient = new WebSocketNetClient(new Logger());
    expect((client as any).logger).toBeTruthy();
    expect((client as any).webSocket === undefined).toBe(true);
    expect((client as any).reader === undefined).toBe(true);
  });

  test("WebSocketNetClient_send", async () => {
    await runWebSocketServer(
      31001,
      async (_: WebSocket.Server, logger: Logger) => {
        const deferred: Deferred<any> = new Deferred<any>();

        // ok
        const client1: WebSocketNetClient = new WebSocketNetClient(logger);
        client1.connect("ws://127.0.0.1:31001");
        await sleep(80);
        expect(client1.send(new Uint8Array(10)))
          .toStrictEqual(true);
        await sleep(30);
        client1.disconnect();
        await sleep(30);
        expect((console.log as any).mock.calls.length).toBe(4);
        expect((console.log as any).mock.calls[0][0])
          .toContain("Info: connecting to ws://127.0.0.1:31001\n");
        expect((console.log as any).mock.calls[1][0])
          .toContain("Info: connection onopen\n");
        expect((console.log as any).mock.calls[2][0])
          .toContain("Info: connection onmessage");
        expect((console.log as any).mock.calls[3][0])
          .toContain("Info: connection onclose\n");

        // not connected
        const client2: WebSocketNetClient = new WebSocketNetClient(logger);
        client2.connect("ws://127.0.0.1:31001");
        expect(client1.send(new Uint8Array(10)))
          .toStrictEqual(false);
        await sleep(80);
        client1.disconnect();

        deferred.doResolve(true);
        return deferred.promise;
      });
  });

  test("WebSocketNetClient_connect", async () => {
    await runWebSocketServer(
      31002,
      async (_: WebSocket.Server, logger: Logger) => {
        const deferred: Deferred<any> = new Deferred<any>();

        // ok
        const client1: WebSocketNetClient = new WebSocketNetClient(logger);
        await sleep(80);
        expect(client1.connect("ws://127.0.0.1:31002"))
          .toStrictEqual(true);
        await sleep(30);
        client1.disconnect();

        // duplicate connect
        const client2: WebSocketNetClient = new WebSocketNetClient(logger);
        await sleep(80);
        expect(client2.connect("ws://127.0.0.1:31002"))
          .toStrictEqual(true);
        expect(client2.connect("ws://127.0.0.1:31002"))
          .toStrictEqual(false);
        await sleep(30);
        client2.disconnect();

        //  onOpen is called
        //  onMessage is called
        //  onClose is called
        let testData: Uint8Array = new Uint8Array(500);
        for (let i: number = 0; i < testData.byteLength; i++) {
          testData[i] = (i % 255) + 1;
        }
        const client3: WebSocketNetClient = new WebSocketNetClient(logger);
        let onOpenCalled: boolean = false;
        let onCloseCalled: boolean = false;
        let onMessageData: Uint8Array = new Uint8Array(0);
        client3.onOpen = () => {
          onOpenCalled = true;
        };
        client3.onClose = () => {
          onCloseCalled = true;
        };
        client3.onBinary = (data: Uint8Array) => {
          onMessageData = data;
        };
        expect(client3.connect("ws://127.0.0.1:31002"))
          .toStrictEqual(true);
        await sleep(80);
        client3.send(testData);
        await sleep(30);
        client3.disconnect();
        await sleep(30);
        expect(onOpenCalled).toStrictEqual(true);
        expect(onCloseCalled).toStrictEqual(true);
        expect(onMessageData).toStrictEqual(testData);

        deferred.doResolve(true);
        return deferred.promise;
      });
  });

  test("WebSocketNetClient_disconnect", async () => {
    await runWebSocketServer(
      31003,
      async (_: WebSocket.Server, logger: Logger) => {
        const deferred: Deferred<any> = new Deferred<any>();

        // ok
        const client1: WebSocketNetClient = new WebSocketNetClient(logger);
        expect(client1.isConnected()).toStrictEqual(false);
        expect(client1.isClosed()).toStrictEqual(true);
        expect(client1.connect("ws://127.0.0.1:31003"))
          .toStrictEqual(true);
        await sleep(80);
        expect(client1.isConnected()).toStrictEqual(true);
        expect(client1.isClosed()).toStrictEqual(false);
        client1.disconnect();
        await sleep(30);
        expect(client1.isConnected()).toStrictEqual(false);
        expect(client1.isClosed()).toStrictEqual(true);

        // disconnect immediately with onError
        const client2: WebSocketNetClient = new WebSocketNetClient(logger);
        let onErrorCalled: boolean = false;
        client2.onError = () => {
          onErrorCalled = true;
        };
        expect(client2.connect("ws://127.0.0.1:31003"))
          .toStrictEqual(true);
        client2.disconnect();
        await sleep(80);
        expect(onErrorCalled).toStrictEqual(true);

        // disconnect immediately without onError
        const client3: WebSocketNetClient = new WebSocketNetClient(logger);
        expect(client3.connect("ws://127.0.0.1:31003"))
          .toStrictEqual(true);
        client3.disconnect();

        // disconnect but webSocket and reader is null
        const client4: WebSocketNetClient = new WebSocketNetClient(logger);
        expect(client4.connect("ws://127.0.0.1:31003"))
          .toStrictEqual(true);
        await sleep(80);
        const ws: WebSocket = (client4 as any).webSocket;
        (client4 as any).webSocket = undefined;
        (client4 as any).reader = undefined;
        ws.close(1000, "");

        // duplicate disconnect
        const client5: WebSocketNetClient = new WebSocketNetClient(logger);
        expect(client5.connect("ws://127.0.0.1:31003"))
          .toStrictEqual(true);
        await sleep(80);
        expect(client5.disconnect()).toStrictEqual(true);
        expect(client5.disconnect()).toStrictEqual(false);
        await sleep(30);

        deferred.doResolve(true);
        return deferred.promise;
      });
  });
});
