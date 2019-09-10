// import {WebSocket} from "ws"
//
// const wss = new WebSocket.Server({ port: 8080 });
//
// wss.on('connection', function connection(ws) {
//   ws.on('message', function incoming(message) {
//     console.log('received: %s', message);
//   });
//
//   ws.send('something');
// });

//
// async function runWebSocketServer(port: number, fn: ()=>void): Promise<any> {
//
//   const wss = new WebSocket.Server({ port: 8080 });
//
//   wss.on('connection', function connection(ws) {
//     ws.on('message', function incoming(message) {
//       console.log('received: %s', message);
//     });
//
//     ws.send('something');
//   });
//
// }

import * as WebSocket from "ws";
import {Deferred} from "./deferred";
import {RPCClient} from "./client";
import {Logger} from "./logger";

async function runWebSocketServer(
  port: number,
  fn: () => Promise<any>,
  ): Promise<any> {
  const deferred: Deferred<any> = new Deferred<any>();

  const wss: WebSocket.Server = new WebSocket.Server({ port: port });
  const logger: Logger = new Logger();

  wss.on("connection", (ws: WebSocket) => {
    ws.onmessage = (event: WebSocket.MessageEvent) => {
      logger.info("onmessage " + event.toString());
    };

    ws.onerror = (event: WebSocket.ErrorEvent) => {
      logger.info("onerror " + event.toString());
    };

    ws.onclose = (event: WebSocket.CloseEvent) => {
      logger.info("onclose " + event.toString());
    };

    logger.info("onopen ");
  });

  await sleep(200);
  await fn();
  await sleep(200);

  wss.close((_?: Error) => {
    deferred.doResolve(true);
  });

  return deferred.promise;
}

async function sleep(timeMS: number): Promise<any> {
  const deferred: Deferred<any> = new Deferred<any>();
  setTimeout(() => {
    deferred.doResolve(true);
  }, timeMS);
  return deferred.promise;
}

describe("client tests", () => {
  test("client_dev", async () => {
    await runWebSocketServer(8888, async () => {
      const deferred: Deferred<any> = new Deferred<any>();

      const rpcClient: RPCClient = new RPCClient("ws://127.0.0.1:8888");
      rpcClient.open();
      await sleep(1000);
      rpcClient.close();

      deferred.doResolve(true);
      return deferred.promise;
    });
  });
});
