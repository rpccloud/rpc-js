import * as WebSocket from "ws";
import {Deferred} from "./deferred";
import {RPCClient} from "./client";
import {Logger} from "./logger";
import {sleep} from "./utils";

async function runWebSocketServer(
  port: number,
  fn: (server: WebSocket.Server) => Promise<any>,
  ): Promise<any> {
  const deferred: Deferred<any> = new Deferred<any>();

  const wss: WebSocket.Server = new WebSocket.Server({ port: port });
  const logger: Logger = new Logger();

  wss.on("connection", async (ws: WebSocket) => {
    ws.onmessage = (event: WebSocket.MessageEvent) => {
      logger.info("onmessage " + event.toString());
    };

    ws.onerror = (event: WebSocket.ErrorEvent) => {
      logger.info("onerror " + event.message);
    };

    ws.onclose = (_: WebSocket.CloseEvent) => {
      logger.info("onclose ");
    };

    await sleep(1000);
    logger.info("connection onopen ");
  });

  await sleep(200);
  await fn(wss);
  await sleep(200);

  wss.close((_?: Error) => {
    deferred.doResolve(true);
  });

  return deferred.promise;
}

describe("client tests", () => {
  beforeEach(() => {
    jest.setTimeout(10000);
  });

  test("client_dev", async () => {
    await runWebSocketServer(8888, async () => {
      const deferred: Deferred<any> = new Deferred<any>();

      const rpcClient: RPCClient = new RPCClient("ws://127.0.0.1:8888");
      rpcClient.open();
      rpcClient.close();
      await sleep(1000);

      deferred.doResolve(true);
      return deferred.promise;
    });
  });
});
