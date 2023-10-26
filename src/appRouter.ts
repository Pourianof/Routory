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
export default class AppRouter extends Router {
  private _delegatingPathParsing(
    p: any,
    t: any,
    method: RequestMethods | 'use'
  ) {
    const controller = (x: any, targetRouter: Router) => {
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
      if (x instanceof AppRouter) {
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

    let parent: Router = this;

    if (t instanceof AppRouter) {
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
    const newRouter = new AppRouter();
    this.use(path, newRouter);
    return newRouter;
  }

  use(path: string, ...RouteHandlerCallback: RouteHandlerCallback[]): AppRouter;
  use(path: string, RouteHandlerCallback: AppRouter): AppRouter;
  use(...routerHandler: RouteHandlerCallback[]): AppRouter;
  use(router: AppRouter, path?: undefined): AppRouter;
  use(p: any, r: any) {
    return this._delegatingPathParsing(p, r, 'use');
  }

  post(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback[]
  ): AppRouter;
  post(...routerHandler: RouteHandlerCallback[]): AppRouter;
  post(path: string, RouteHandlerCallback: AppRouter): AppRouter;
  post(p: any, r: any): AppRouter {
    return this._delegatingPathParsing(p, r, RequestMethods.POST);
  }

  get(path: string, ...RouteHandlerCallback: RouteHandlerCallback[]): AppRouter;
  get(...routerHandler: RouteHandlerCallback[]): AppRouter;
  get(p: any, r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.GET);
  }

  put(path: string, ...RouteHandlerCallback: RouteHandlerCallback[]): AppRouter;
  put(...routerHandler: RouteHandlerCallback[]): AppRouter;
  put(p: any, r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.POST);
  }

  push(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback[]
  ): AppRouter;
  push(path: string, RouteHandlerCallback: AppRouter): AppRouter;
  push(p: any, r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.PUSH);
  }

  delete(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback[]
  ): AppRouter;
  delete(...routerHandler: RouteHandlerCallback[]): AppRouter;
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
