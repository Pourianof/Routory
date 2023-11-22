import Notifier from './notifier';
import { RequestMethods, RouterRequest } from './routerRequest';
import RouterRespond from './routerRespond';

export type RouteHandlerCallback<R extends RouterRequest = RouterRequest> = (
  req: R,
  res: RouterRespond,
  next: (err?: any) => void
) => any;

export interface RouteHandler<R extends RouterRequest = RouterRequest> {
  cb: RouteHandlerCallback<R>;
  method: RequestMethods | 'use';
}

export type ErrorHandlerCallback<R extends RouterRequest = RouterRequest> = (
  err: any,
  req: R,
  res: RouterRespond,
  next: () => any
) => any;

export default abstract class Router<
  CTX extends {} = {},
  R extends RouterRequest<CTX> = RouterRequest<CTX>,
> {
  static pathSeperator = '/';

  protected static errHandlerCallback: ErrorHandlerCallback[] = [];
  private static triggerErrorHandling<R extends RouterRequest = RouterRequest>(
    err: any,
    req: R,
    res: RouterRespond,
    index: number = 0
  ) {
    if (Router.errHandlerCallback.length && Router.errHandlerCallback[index]) {
      Router.errHandlerCallback[index](err, req, res, () => {
        this.triggerErrorHandling(err, req, res, index + 1);
      });
    }
  }

  protected onErrorHandling(
    err: any,
    req: RouterRequest,
    res: RouterRespond
  ): any {
    Router.triggerErrorHandling(err, req, res);
  }
  protected static pathNormalizing(path: string) {
    path = path.trim();
    if (path.startsWith(Router.pathSeperator)) {
      path = path.substring(1);
    }
    if (path.endsWith(Router.pathSeperator)) {
      path = path.substring(0, path.length - 1);
    }
    return path;
  }

  protected handlersQueue: (RouteHandler<R> | Router<CTX>)[] = [];
  protected _path: string = '';
  protected hasParam = false;
  protected set path(p: string) {
    if (p) {
      this._path = Router.pathNormalizing(p);
      this.hasParam = this._path.includes(':');
    }
  }
  protected get path() {
    return this._path;
  }
  protected isMatch(p: string, method: RequestMethods): boolean {
    const pathPatternParts = this.path.split(Router.pathSeperator);
    const pathParts = p.split(Router.pathSeperator);

    let match: boolean = true;
    for (let i = 0; i < pathPatternParts.length; i++) {
      const _p = pathPatternParts[i];
      const _t = pathParts[i].trim();

      if ((_p.startsWith(':') && _t) || _t === _p) {
        continue;
      } else {
        match = false;
        break;
      }
    }

    return match;
  }

  private finishedSym = Symbol('finished');

  protected async goNext(
    req: RouterRequest,
    res: RouterRespond,
    startFromIndex: number = 0,
    goNext?: () => any
  ): Promise<void> {
    const rp = Router.pathNormalizing(req.relativePath);
    let forwardPath: string;

    if (this.hasParam) {
      const i = rp.indexOf(Router.pathSeperator);
      if (i < 0) {
        forwardPath = '';
      } else {
        forwardPath = rp.substring(rp.indexOf(Router.pathSeperator));
      }
    } else {
      forwardPath = rp.substring(this.path.length);
    }

    forwardPath = Router.pathNormalizing(forwardPath);
    let params: { [key: string]: any } = {};

    if (this.hasParam) {
      const pathParts = rp.split(Router.pathSeperator);
      this.path.split(Router.pathSeperator).forEach((name, index) => {
        if (name.startsWith(':')) {
          name = name.substring(1);
          params[name] = pathParts[index];
        }
      });
    }

    let next: Router<CTX> | RouteHandlerCallback<R> | undefined;

    let i = startFromIndex;
    for (; i < this.handlersQueue.length; i++) {
      const handler = this.handlersQueue[i];
      const isRouter = handler instanceof Router;
      if (isRouter && handler.isMatch(forwardPath, req.method)) {
        next = handler;
        break;
      } else if (
        !isRouter &&
        ((handler.method === req.method && !forwardPath) ||
          handler.method === 'use')
      ) {
        next = (handler as RouteHandler).cb;
        break;
      }
    }
    if (next) {
      req.params = { ...req.params, ...params };
      const n = (err?: any) => {
        if (err) {
          this.onErrorHandling(err, req, res);
          return;
        }
        req.relativePath = rp;
        this.goNext(req, res, i + 1, goNext);
      };
      if (next instanceof Router) {
        req.relativePath = forwardPath;
        next.goNext(req, res, 0, n);
      } else {
        const waiter = next(req as R, res, n);
        if (waiter instanceof Promise) {
          waiter.catch((err) => {
            n(err);
          });
        }
      }
    } else if (goNext) {
      Object.keys(params).forEach((key) => {
        delete req.params[key];
      });
      goNext();
    }
  }
  _use(handlers: (RouteHandler<R> | Router)[]) {
    if (handlers instanceof Array) {
      this.handlersQueue.push(...handlers);
      return;
    }
    this.handlersQueue.push(handlers);
  }

  toString() {
    return `
      ^^ name : ${this.path}
      ** handlers.length: ${this.handlersQueue.length}
    `;
  }
}
