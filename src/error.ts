export enum RPCErrorKind {
  None = 0,
  Protocol = 1,
  Transport = 2,
  Reply = 3,
  ReplyPanic = 4,
  RuntimePanic = 5,
  KernelPanic = 6,
}

export class RPCError {
  public static newProtocolError(message: string): RPCError {
    return new RPCError(RPCErrorKind.Protocol, message, "");
  }

  public static newTransportError(message: string): RPCError {
    return new RPCError(RPCErrorKind.Transport, message, "");
  }

  public static newReplyError(message: string): RPCError {
    return new RPCError(RPCErrorKind.Reply, message, "");
  }

  public static newReplyPanic(message: string): RPCError {
    return new RPCError(RPCErrorKind.ReplyPanic, message, "");
  }

  public static newRuntimePanic(message: string): RPCError {
    return new RPCError(RPCErrorKind.RuntimePanic, message, "");
  }

  public static newKernelPanic(message: string): RPCError {
    return new RPCError(RPCErrorKind.KernelPanic, message, "");
  }

  private readonly kind: RPCErrorKind;
  private readonly message: string;
  private debug: string;

  public constructor(kind: RPCErrorKind, message: string, debug: string) {
    this.kind = kind;
    this.message = message;
    this.debug = debug;
  }

  public getKind(): RPCErrorKind {
    return this.kind;
  }

  public getMessage(): string {
    return this.message;
  }

  public getDebug(): string {
    return this.debug;
  }

  public addDebug(debug: string): RPCError {
    if (!this.debug) {
      this.debug = debug;
    } else {
      this.debug += "\n";
      this.debug += debug;
    }

    return this;
  }
}
