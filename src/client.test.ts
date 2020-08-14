import {RPCClient} from "./client";
import {RPCAny} from "./types";

describe("RPCClient dev", () => {
  beforeEach(() => {
    jest.setTimeout(1000000);
  });

  afterEach(() => {
    jest.setTimeout(5000);
  });

  test("RPCClient_new", async () => {
    const client: RPCClient = new RPCClient("ws://127.0.0.1:8080/");
    let sum: number = 0;
    for (let i: number = 0; i < 500; i++) {
      try {
        let v: RPCAny = await client.send(3000, "#.user:SayHello", `ts${i}`);
        if (v?.toString().startsWith("hello ts")) {
          sum++;
        }
      } catch (e) {
        expect(e).toStrictEqual(null);
      }
    }

    expect(sum).toStrictEqual(500);
    client.close();
  });
});

//
// async function runWebSocketServer(
//   port: number,
//   fn: (server: WebSocket.Server, logger: Logger) => Promise<any>,
// ): Promise<any> {
//   const deferred: Deferred<any> = new Deferred<any>();
//
//   const wss: WebSocket.Server = new WebSocket.Server({port: port});
//   const logger: Logger = new Logger();
//
//   wss.on("connection", async (ws: WebSocket) => {
//     logger.info("connection onopen");
//
//     ws.onmessage = (event: WebSocket.MessageEvent) => {
//       logger.info(`connection onmessage ${(event.data as Buffer).length}`);
//       ws.send(event.data);
//       ws.send("string type message to client");
//     };
//
//     ws.onerror = (event: WebSocket.ErrorEvent) => {
//       logger.info("connection onerror " + event.message);
//     };
//
//     ws.onclose = (_: WebSocket.CloseEvent) => {
//       logger.info("connection onclose");
//     };
//   });
//
//   await sleep(100);
//   await fn(wss, logger);
//   await sleep(100);
//
//   wss.close((_?: Error) => {
//     deferred.doResolve(true);
//   });
//
//   return deferred.promise;
// }
//

//
//
// describe("WebSocketNetClient tests", () => {
//   beforeEach(() => {
//     jest.spyOn(console, "log");
//   });
//
//   afterEach(() => {
//     jest.clearAllMocks();
//   });
//
//   test("WebSocketNetClient_new", async () => {
//     const client: RPCClient = new RPCClient("ws://127.0.0.1:31001");
//
//     client.close();
//   });
//
//   test("WebSocketNetClient_send", async () => {
//     await runWebSocketServer(
//       31001,
//       async (_: WebSocket.Server, logger: Logger) => {
//         // ok
//         const client1: WebSocketNetClient = new WebSocketNetClient(logger);
//         client1.connect("ws://127.0.0.1:31001");
//         await sleep(100);
//         expect(client1.send(new Uint8Array(10)))
//           .toStrictEqual(true);
//         await sleep(30);
//         client1.disconnect();
//         await sleep(30);
//         expect((console.log as any).mock.calls.length).toBe(4);
//         expect((console.log as any).mock.calls[0][0])
//           .toContain("Info: connecting to ws://127.0.0.1:31001\n");
//         expect((console.log as any).mock.calls[1][0])
//           .toContain("Info: connection onopen\n");
//         expect((console.log as any).mock.calls[2][0])
//           .toContain("Info: connection onmessage");
//         expect((console.log as any).mock.calls[3][0])
//           .toContain("Info: connection onclose\n");
//
//         // not connected
//         const client2: WebSocketNetClient = new WebSocketNetClient(logger);
//         client2.connect("ws://127.0.0.1:31001");
//         expect(client1.send(new Uint8Array(10)))
//           .toStrictEqual(false);
//         await sleep(100);
//         client1.disconnect();
//       },
//     );
//   });
//
//   test("WebSocketNetClient_connect", async () => {
//     await runWebSocketServer(
//       31002,
//       async (_: WebSocket.Server, logger: Logger) => {
//         // ok
//         const client1: WebSocketNetClient = new WebSocketNetClient(logger);
//         await sleep(100);
//         expect(client1.connect("ws://127.0.0.1:31002"))
//           .toStrictEqual(true);
//         await sleep(30);
//         client1.disconnect();
//
//         // duplicate connect
//         const client2: WebSocketNetClient = new WebSocketNetClient(logger);
//         await sleep(100);
//         expect(client2.connect("ws://127.0.0.1:31002"))
//           .toStrictEqual(true);
//         expect(client2.connect("ws://127.0.0.1:31002"))
//           .toStrictEqual(false);
//         await sleep(30);
//         client2.disconnect();
//
//         //  onOpen is called
//         //  onMessage is called
//         //  onClose is called
//         let testData: Uint8Array = new Uint8Array(500);
//         for (let i: number = 0; i < testData.byteLength; i++) {
//           testData[i] = (i % 255) + 1;
//         }
//         const client3: WebSocketNetClient = new WebSocketNetClient(logger);
//         let onOpenCalled: boolean = false;
//         let onCloseCalled: boolean = false;
//         let onMessageData: Uint8Array = new Uint8Array(0);
//         client3.onOpen = () => {
//           onOpenCalled = true;
//         };
//         client3.onClose = () => {
//           onCloseCalled = true;
//         };
//         client3.onStream = (stream: RPCStream) => {
//           onMessageData = stream.getBuffer();
//         };
//         expect(client3.connect("ws://127.0.0.1:31002"))
//           .toStrictEqual(true);
//         await sleep(100);
//         client3.send(testData);
//         await sleep(30);
//         client3.disconnect();
//         await sleep(30);
//         expect(onOpenCalled).toStrictEqual(true);
//         expect(onCloseCalled).toStrictEqual(true);
//         expect(onMessageData).toStrictEqual(testData);
//       },
//     );
//   });
//
//   test("WebSocketNetClient_disconnect", async () => {
//     await runWebSocketServer(
//       31003,
//       async (_: WebSocket.Server, logger: Logger) => {
//         // ok
//         const client1: WebSocketNetClient = new WebSocketNetClient(logger);
//         expect(client1.isConnected()).toStrictEqual(false);
//         expect(client1.isClosed()).toStrictEqual(true);
//         expect(client1.connect("ws://127.0.0.1:31003"))
//           .toStrictEqual(true);
//         await sleep(100);
//         expect(client1.isConnected()).toStrictEqual(true);
//         expect(client1.isClosed()).toStrictEqual(false);
//         client1.disconnect();
//         await sleep(30);
//         expect(client1.isConnected()).toStrictEqual(false);
//         expect(client1.isClosed()).toStrictEqual(true);
//
//         // disconnect immediately with onError
//         const client2: WebSocketNetClient = new WebSocketNetClient(logger);
//         let onErrorCalled: boolean = false;
//         client2.onError = () => {
//           onErrorCalled = true;
//         };
//         expect(client2.connect("ws://127.0.0.1:31003"))
//           .toStrictEqual(true);
//         client2.disconnect();
//         await sleep(100);
//         expect(onErrorCalled).toStrictEqual(true);
//
//         // disconnect immediately without onError
//         const client3: WebSocketNetClient = new WebSocketNetClient(logger);
//         expect(client3.connect("ws://127.0.0.1:31003"))
//           .toStrictEqual(true);
//         client3.disconnect();
//
//         // disconnect but webSocket and reader is null
//         const client4: WebSocketNetClient = new WebSocketNetClient(logger);
//         expect(client4.connect("ws://127.0.0.1:31003"))
//           .toStrictEqual(true);
//         await sleep(100);
//         const ws: WebSocket = (client4 as any).webSocket;
//         (client4 as any).webSocket = undefined;
//         (client4 as any).reader = undefined;
//         ws.close(1000, "");
//
//         // duplicate disconnect
//         const client5: WebSocketNetClient = new WebSocketNetClient(logger);
//         expect(client5.connect("ws://127.0.0.1:31003"))
//           .toStrictEqual(true);
//         await sleep(100);
//         expect(client5.disconnect()).toStrictEqual(true);
//         expect(client5.disconnect()).toStrictEqual(false);
//         await sleep(30);
//       },
//     );
//   });
// });
//
// describe("RPCClient tests", () => {
//   beforeEach(() => {
//     jest.setTimeout(200000);
//     jest.spyOn(console, "log");
//   });
//
//   afterEach(() => {
//     jest.clearAllMocks();
//     jest.setTimeout(5000);
//   });
//
//   test("RPCClient_new", async () => {
//     const client1: RPCClient = new RPCClient();
//     expect((client1 as any).netClient === undefined).toBe(true);
//     expect((client1 as any).url).toStrictEqual("");
//     expect((client1 as any).checkTimer === null).toBe(true);
//     expect((client1 as any).checkTimerInterval).toStrictEqual(1000);
//     expect((client1 as any).tryConnectCount).toStrictEqual(0);
//     expect((client1 as any).cbSeed).toStrictEqual(1);
//     expect((client1 as any).logger).toBeTruthy();
//     expect((client1 as any).pools).toBeTruthy();
//   });
//
//   test("RPCClient_checkConnect", async () => {
//     const client1: RPCClient = new RPCClient();
//     (client1 as any).checkTimerInterval = 100;
//     (client1 as any).pools.push(true);  // to open fast conn mode
//     client1.open("ws://127.0.0.1:22332");
//     await sleep(1800);
//
//     const callTimes: Array<Date> = [];
//     const logLength: number = (console.log as any).mock.calls.length;
//     for (let i: number = 0; i < logLength; i++) {
//       const log: string = (console.log as any).mock.calls[i][0];
//       if (log.includes("connecting")) {
//         callTimes.push(new Date(log.split(" ")[0]));
//       }
//     }
//
//     expect(callTimes.length).toStrictEqual(5);
//     const delta0: number = callTimes[1].getTime() - callTimes[0].getTime();
//     const delta1: number = callTimes[2].getTime() - callTimes[1].getTime();
//     const delta2: number = callTimes[3].getTime() - callTimes[2].getTime();
//     const delta3: number = callTimes[4].getTime() - callTimes[3].getTime();
//     expect(delta0 > 150 && delta0 < 250).toStrictEqual(true);
//     expect(delta1 > 250 && delta1 < 350).toStrictEqual(true);
//     expect(delta2 > 450 && delta2 < 550).toStrictEqual(true);
//     expect(delta3 > 450 && delta3 < 550).toStrictEqual(true);
//   });
//
//   test("RPCClient_open_close", async () => {
//     await runWebSocketServer(
//       31004,
//       async (_: WebSocket.Server) => {
//         // checkConnect twice
//         const client1: RPCClient = new RPCClient();
//         (client1 as any).checkTimerInterval = 100;
//         (client1 as any).checkConnect();
//         (client1 as any).checkConnect();
//
//         expect(client1.open("ws://127.0.0.1:31004"))
//           .toStrictEqual(true);
//         expect(client1.open("ws://127.0.0.1:31004"))
//           .toStrictEqual(false);
//         await sleep(1000);
//         expect(await client1.close()).toStrictEqual(true);
//         expect(await client1.close()).toStrictEqual(false);
//       },
//     );
//   });
// });
