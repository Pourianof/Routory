import Router, {
  MethodRouteManager,
  RouteHandler,
  RouteHandlerCallback,
} from './router';
import { RequestMethods, RouterRequest } from './routerRequest';
import RouterRespond from './routerRespond';
import RouterMessage from './routerMessage';
/**
 * Represent a relative route handler
 */
export default class Routory<
  CTX extends {} = {},
  R extends RouterRequest<CTX> = RouterRequest<CTX>,
> extends Router<CTX> {
  private _delegatingPathParsing(
    p: any,
    t: any,
    method: RequestMethods | 'use'
  ) {
    const controller = (x: any, targetRouter: Router<CTX>) => {
      if (typeof x === 'function') {
        targetRouter._use([{ cb: x, method } as RouteHandler]);
        return true;
      }
      if (x instanceof Array) {
        targetRouter._use(
          x.map((cb: RouteHandlerCallback) => ({ cb, method }))
        );
        return true;
      }
      if (x instanceof Routory) {
        targetRouter._use(x);
        return true;
      }
      return false;
    };
    const isPathSpecified = typeof p === 'string';

    if (isPathSpecified) {
      p = p.trim();
    } else {
      t = p;
      p = Router.pathSeperator;
    }

    let parent: Router<CTX> = this;

    if (t instanceof Routory) {
      t.path = p;
    } else if (p && p !== Router.pathSeperator) {
      parent = new MethodRouteManager(p, method);
      this.handlersQueue.push(parent);
    }

    if (!controller(t, parent)) {
      throw new Error(`Wrong paramaters for method |${method}|`);
    }
    return this;
  }

  route(path: string) {
    const newRouter = new Routory();
    this.use(path, newRouter);
    return newRouter;
  }

  use(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): Routory<CTX>;
  use(path: string, RouteHandlerCallback: Routory): Routory<CTX>;
  use(...routerHandler: RouteHandlerCallback<R>[]): Routory<CTX>;
  use(router: Routory, path?: undefined): Routory<CTX>;
  use(p: any, r: any) {
    return this._delegatingPathParsing(p, r, 'use');
  }

  post(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): Routory<CTX>;
  post(...routerHandler: RouteHandlerCallback<R>[]): Routory<CTX>;
  post(path: string, RouteHandlerCallback: Routory): Routory<CTX>;
  post(p: any, r: any): Routory<CTX> {
    return this._delegatingPathParsing(p, r, RequestMethods.POST);
  }

  get(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): Routory<CTX>;
  get(...routerHandler: RouteHandlerCallback<R>[]): Routory<CTX>;
  get(p: any, r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.GET);
  }

  put(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): Routory<CTX>;
  put(...routerHandler: RouteHandlerCallback<R>[]): Routory<CTX>;
  put(p: any, r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.POST);
  }

  push(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): Routory<CTX>;
  push(path: string, RouteHandlerCallback: Routory): Routory<CTX>;
  push(p: any, r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.PUSH);
  }

  delete(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): Routory<CTX>;
  delete(...routerHandler: RouteHandlerCallback<R>[]): Routory<CTX>;
  delete(p: any, r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.DELETE);
  }

  onMessage(message: RouterMessage, db: any) {
    const url = message.url.trim();
    const res = new RouterRespond();
    const req: RouterRequest = new RouterRequest(
      message.method,
      {},
      url,
      url,
      message.data,
      { db: db }
    );
    this.goNext(req, res);
    return res;
  }
}
