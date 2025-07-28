import { pathSeperator } from './configs';
import GlobalErrorHandler, { ErrorHandlerCallback } from './globalErrorHandler';
import MethodRouteManager from './methodRouteManager';
import Router, { RouteHandler, RouteHandlerCallback } from './router';
import RouterFactory from './routerFactory';
import RouterMessage from './routerMessage';
import { RouterRequest } from './routerRequest';
import RouterRespond from './routerRespond';

abstract class BaseRoutory {}

/**
 * Represent a relative route handler
 */
export default abstract class Routory<
  F extends Routory<any, CTX, R>,
  CTX extends {} = {},
  R extends RouterRequest<CTX> = RouterRequest<CTX>,
> extends Router<CTX> {
  constructor(private subRouterFactory: RouterFactory<CTX, R, F>) {
    super();
  }
  protected _delegatingPathParsing(
    p: any,
    t: (Router | RouteHandlerCallback<R>)[],
    method: string,
  ): F {
    const controller = (
      x: (Router | RouteHandlerCallback<R>)[],
      targetRouter: Router<CTX>,
    ) => {
      const val: (Router | RouteHandler)[] = x.map(
        (cb: RouteHandlerCallback<R> | Router) =>
          cb instanceof Routory || cb instanceof Router
            ? (((cb as any).path = ''), cb)
            : ({ cb, method } as RouteHandler),
      );
      targetRouter._use(val);
    };
    const isPathSpecified = typeof p === 'string';

    let parent: Router<CTX> = this;

    // if any path specidied we create a new router to handle that route
    if (isPathSpecified) {
      p = p.trim();
      if (p && p !== pathSeperator) {
        if (method != 'use') {
          parent = new MethodRouteManager(p, method);
        } else {
          parent = this.subRouterFactory.create();
          (parent as F).path = p;
        }
        this._use([parent]);
      }
    } else {
      // prepend the first argumant which was not a path but a handler
      t.unshift(p);
      p = pathSeperator;
    }

    controller(t, parent);
    return this as never as F;
  }

  handleErrorGlobally(handler: ErrorHandlerCallback<R>) {
    GlobalErrorHandler.instance.registerErrorHandlerCallback(
      handler as ErrorHandlerCallback,
    );
  }

  route(path: string): F {
    const newRouter = this.subRouterFactory.create();
    (newRouter as F).path = path;
    this._use([newRouter]);
    return newRouter;
  }

  use(
    path: string,
    ...RouteHandlerCallback: (Router | RouteHandlerCallback<R>)[]
  ): F;
  use(...routerHandler: (Router | RouteHandlerCallback<R>)[]): F;
  use(errHandlerCallback: ErrorHandlerCallback<R>): F;
  use(path: string, RouteHandlerCallback: F): F;
  use(router: F, path?: undefined): F;
  use(p: any, ...r: any) {
    return this._delegatingPathParsing(p, r, 'use');
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
