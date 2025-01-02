import { RouterRequest } from './routerRequest';
import RouterRespond from './routerRespond';

export type ErrorHandlerCallback<R extends RouterRequest = RouterRequest> = (
  err: any,
  req: R,
  res: RouterRespond,
  next: () => any,
) => any;

export default class GlobalErrorHandler {
  protected globalErrHandlerCallbacks: ErrorHandlerCallback[] = [];
  private triggerErrorHandling<R extends RouterRequest = RouterRequest>(
    err: any,
    req: R,
    res: RouterRespond,
    index: number = 0,
  ) {
    if (
      this.globalErrHandlerCallbacks.length &&
      this.globalErrHandlerCallbacks[index]
    ) {
      this.globalErrHandlerCallbacks[index](err, req, res, () => {
        this.triggerErrorHandling(err, req, res, index + 1);
      });
    }
  }

  onErrorHandling(err: any, req: RouterRequest, res: RouterRespond): any {
    this.triggerErrorHandling(err, req, res);
  }

  registerErrorHandlerCallback(callback: ErrorHandlerCallback) {}

  static _instance?: GlobalErrorHandler;
  private constructor() {}

  static get instance() {
    return (this._instance ??= new GlobalErrorHandler());
  }
}
