export
class Deferred<T> {
  public readonly promise: Promise<T>;
  private resolve?: (value?: T | PromiseLike<T>) => void;
  private reject?: (reason?: any) => void;

  public constructor() {
    this.promise = new Promise ((
      resolve: (value?: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void,
    ) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  public doResolve(value?: T | PromiseLike<T>): boolean {
    if (this.resolve) {
      this.resolve(value);
      this.resolve = undefined;
      this.reject = undefined;
      return true;
    } else {
      return false;
    }
  }

  public doReject(reason?: any): boolean {
    if (this.reject) {
      this.reject(reason);
      this.resolve = undefined;
      this.reject = undefined;
      return true;
    } else {
      return false;
    }
  }
}
