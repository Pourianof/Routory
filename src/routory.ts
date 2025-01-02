import Router, { RouteHandler, RouteHandlerCallback } from './router';
import { RequestMethods, RouterRequest } from './routerRequest';
import RouterRespond from './routerRespond';
import RouterMessage from './routerMessage';
import MethodRouteManager from './methodRouteManager';
import RouterRespondMessage from './routerRespondMessage';
import { pathSeperator } from './configs';
import GlobalErrorHandler, { ErrorHandlerCallback } from './globalErrorHandler';
/**
 * Represent a relative route handler
 */
export default class Routory<
  CTX extends {} = {},
  R extends RouterRequest<CTX> = RouterRequest<CTX>,
> extends Router<CTX> {
  private _delegatingPathParsing(
    p: any,
    t: (Router | RouteHandlerCallback<R>)[],
    method: RequestMethods | 'use',
  ) {
    const controller = (
      x: (Router | RouteHandlerCallback<R>)[],
      targetRouter: Router<CTX>,
    ) => {
      const val: (Router | RouteHandler)[] = x.map(
        (cb: RouteHandlerCallback<R> | Router) =>
          cb instanceof Routory
            ? ((cb.path = p), cb)
            : cb instanceof Router
              ? cb
              : ({ cb, method } as RouteHandler),
      );
      targetRouter._use(val);
    };
    const isPathSpecified = typeof p === 'string';

    let parent: Router<CTX> = this;

    if (isPathSpecified) {
      p = p.trim();
      if (
        p &&
        p !== pathSeperator &&
        !(t[0] instanceof Routory && t.length === 1)
      ) {
        parent = new MethodRouteManager(p, method);
        this.handlersQueue.push(parent);
      }
    } else {
      if ((p as Function).length === 4) {
        GlobalErrorHandler.instance.registerErrorHandlerCallback(p);
        return this;
      }
      t.unshift(p);
      p = pathSeperator;
    }

    controller(t, parent);
    return this;
  }

  route(path: string) {
    const newRouter = new Routory<CTX>();
    this.use(path, newRouter);
    return newRouter;
  }

  use(
    path: string,
    ...RouteHandlerCallback: (Router | RouteHandlerCallback<R>)[]
  ): Routory<CTX>;
  use(...routerHandler: (Router | RouteHandlerCallback<R>)[]): Routory<CTX>;
  use(errHandlerCallback: ErrorHandlerCallback<R>): Routory<CTX>;
  use(path: string, RouteHandlerCallback: Routory<CTX>): Routory<CTX>;
  use(router: Routory, path?: undefined): Routory<CTX>;
  use(p: any, ...r: any) {
    return this._delegatingPathParsing(p, r, 'use');
  }

  post(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): Routory<CTX>;
  post(...routerHandler: RouteHandlerCallback<R>[]): Routory<CTX>;
  post(path: string, RouteHandlerCallback: Routory): Routory<CTX>;
  post(p: any, ...r: any): Routory<CTX> {
    return this._delegatingPathParsing(p, r, RequestMethods.POST);
  }

  get(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): Routory<CTX>;
  get(...routerHandler: RouteHandlerCallback<R>[]): Routory<CTX>;
  get(p: any, ...r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.GET);
  }

  put(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): Routory<CTX>;
  put(...routerHandler: RouteHandlerCallback<R>[]): Routory<CTX>;
  put(p: any, ...r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.PUT);
  }

  patch(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): Routory<CTX>;
  patch(...routerHandler: RouteHandlerCallback<R>[]): Routory<CTX>;
  patch(p: any, ...r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.PATCH);
  }

  delete(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): Routory<CTX>;
  delete(...routerHandler: RouteHandlerCallback<R>[]): Routory<CTX>;
  delete(p: any, ...r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.DELETE);
  }

  onMessage(message: RouterMessage, context: CTX) {
    const url = message.url.trim();
    const res = new RouterRespond();
    const req: RouterRequest = new RouterRequest(
      message.method,
      {},
      url,
      url,
      message.data,
      context,
    );
    this.handleRequest(req, res);
    return res;
  }
}

export {
  RouterRespond,
  RouterRespondMessage,
  RouterRequest,
  Router,
  RouterMessage,
  RequestMethods,
};
