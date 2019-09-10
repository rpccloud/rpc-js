import * as WebSocket from "ws";
import {Deferred} from "./deferred";
import {RPCClient, WebSocketNetClient} from "./client";
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
      logger.info("connection onmessage " + event.data.toString());
      ws.send(event.data);
    };

    ws.onerror = (event: WebSocket.ErrorEvent) => {
      logger.info("connection onerror " + event.message);
    };

    ws.onclose = (_: WebSocket.CloseEvent) => {
      logger.info("connection onclose");
    };
  });

  await sleep(200);
  await fn(wss, logger);
  await sleep(200);

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
        await sleep(80);
        client1.disconnect();
        await sleep(80);
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
        await sleep(80);

        deferred.doResolve(true);
        return deferred.promise;
      });
  });

  test("client_dev", async () => {
    await runWebSocketServer(22002, async () => {
      const deferred: Deferred<any> = new Deferred<any>();

      const rpcClient: RPCClient = new RPCClient("ws://127.0.0.1:12345/ws");
      rpcClient.open();

      await sleep(1000);
      rpcClient.close();

      deferred.doResolve(true);
      return deferred.promise;
    });
  });
});
