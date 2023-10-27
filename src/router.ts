import { RequestMethods, RouterRequest } from './routerRequest';
import RouterRespond from './routerRespond';

export type RouteHandlerCallback<R extends RouterRequest = RouterRequest> = (
  req: R,
  res: RouterRespond,
  next: () => void
) => void;

export interface RouteHandler<R extends RouterRequest = RouterRequest> {
  cb: RouteHandlerCallback<R>;
  method: RequestMethods | 'use';
}

export default abstract class Router<
  CTX extends {} = {},
  R extends RouterRequest<CTX> = RouterRequest<CTX>,
> {
  static pathSeperator = '/';
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
      const _t = pathParts[i];

      if (_p.startsWith(':') || _t === _p) {
        continue;
      } else {
        match = false;
        break;
      }
    }

    return match;
  }
  goNext(
    req: RouterRequest,
    res: RouterRespond,
    startFromIndex: number = 0,
    goNext?: () => any
  ): void {
    const rp = Router.pathNormalizing(req.relativePath);
    const forwardPath = Router.pathNormalizing(rp.substring(this.path.length));
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
      const n = () => {
        req.relativePath = rp;
        this.goNext(req, res, i + 1, goNext);
      };
      if (next instanceof Router) {
        req.relativePath = forwardPath;
        next.goNext(req, res, 0, n);
      } else {
        next(req as R, res, n);
      }
    } else if (goNext) {
      Object.keys(params).forEach((key) => {
        delete req.params[key];
      });
      goNext();
    }
  }
  _use(handlers: RouteHandler[] | Router) {
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

/**
 * Represent an absolute path Handler with one method
 */
export class MethodRouteManager extends Router {
  constructor(
    path: string,
    private method: RequestMethods | 'use'
  ) {
    super();
    this.path = path;
  }

  protected isMatch(p: string, m: RequestMethods): boolean {
    return super.isMatch(p, m) && this.method === m;
  }
  toString(): string {
    return `
    ${super.toString()}
    ## method : ${this.method}
    `;
  }
}
