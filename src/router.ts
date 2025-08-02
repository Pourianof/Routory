import { pathSeperator } from './configs';
import { HandleUnMachedRoutePathException } from './exceptions';
import { pathNormalizing } from './routeParsingUtils';
import RouterExecutionScope from './routerExecutionScope';
import { RequestMethods, RouterRequest } from './routerRequest';
import RouterRespond from './routerRespond';

export type RouteHandlerCallback<R extends RouterRequest = RouterRequest> = (
  req: R,
  res: RouterRespond,
  next: (err?: any) => void,
) => any;

export interface RouteHandler<R extends RouterRequest = RouterRequest> {
  cb: RouteHandlerCallback<R>;
  method: RequestMethods | 'use';
}

export interface RequestedPathParseResult {
  isMatched: boolean;
  forwardPath?: string;
  params?: {
    [key: string]: string;
  };
}

export default abstract class Router<
  CTX extends {} = {},
  R extends RouterRequest<CTX> = RouterRequest<CTX>,
> {
  protected handlersQueue: (RouteHandler<R> | Router<CTX>)[] = [];
  protected _path: string = '';
  protected hasParam = false;
  protected set path(p: string) {
    if (p) {
      this._path = pathNormalizing(p);
      this.hasParam = this._path.includes(':');
    }
  }
  get path() {
    return this._path;
  }

  private cachedParse?: {
    requestedPath: string;
    result: RequestedPathParseResult;
    withParams: boolean;
  };

  protected parsePath(
    otherPath: string,
    method: RequestMethods,
    options?: { populateParams?: boolean },
  ): RequestedPathParseResult {
    if (
      this.cachedParse?.requestedPath == otherPath &&
      (this.cachedParse.withParams ||
        !!options?.populateParams == this.cachedParse.withParams)
    ) {
      return this.cachedParse.result;
    }

    const pathPatternParts = this.path.split(pathSeperator);
    const otherPathParts = otherPath.split(pathSeperator);

    // path is empty string which means it match with everything
    if (!this.path) {
      this.cachedParse = {
        requestedPath: otherPath,
        result: { isMatched: true, forwardPath: otherPath },
        withParams: true,
      };
      return this.cachedParse.result;
    }

    let match: boolean = true;
    let params: RequestedPathParseResult['params'];
    let index = 0;
    for (; index < pathPatternParts.length; index++) {
      const _p = pathPatternParts[index];
      const _t = otherPathParts[index].trim();
      const isParam = _p.startsWith(':') && _t;

      if (isParam || _t === _p) {
        if (isParam && options?.populateParams) {
          params ??= {};
          params[_p.substring(1)] = _t;
        }
        continue;
      } else {
        match = false;
        break;
      }
    }

    const parseResult: RequestedPathParseResult = {
      isMatched: match,
      params,
    };

    if (match) {
      parseResult.forwardPath = otherPathParts.slice(index).join(pathSeperator);
      this.cachedParse = {
        requestedPath: otherPath,
        result: parseResult,
        withParams: !!options?.populateParams,
      };
    }

    return parseResult;
  }

  get isMultiPart() {
    return this.path.includes(pathSeperator);
  }

  private finishedSym = Symbol('finished');

  /**
   * Forward request to matched sub-router or callback
   *
   * Note: this method does not any path matching of requested path and router path(by this.isMatch)
   * for registered callbacks, because it must done by upper(parent) router.
   * @param req Input request object
   * @param res Response object
   * @param startFromIndex Index where hadnlers should start to get check for next invokation
   * @param goNext Callback which should execute when all router callbacks has been called
   */

  handleRequest(req: RouterRequest, res: RouterRespond, afterAll?: () => any) {
    const rp = pathNormalizing(req.relativePath);

    const analyzeResult = this.parsePath(rp, req.method, {
      populateParams: true,
    });

    if (!analyzeResult.isMatched) {
      throw new HandleUnMachedRoutePathException(rp, this.path);
    }

    const execScope = new RouterExecutionScope(
      this,
      req,
      res,
      analyzeResult,
      afterAll,
    );
    execScope.run();
  }

  getHandlerFor(
    method: RequestMethods,
    requestedPath?: string,
    startFromIndex: number = 0,
  ):
    | {
        handler: Router<CTX> | RouteHandlerCallback<R>;
        index: number;
      }
    | undefined {
    let next: Router<CTX> | RouteHandlerCallback<R> | undefined;

    let index = startFromIndex;
    for (; index < this.handlersQueue.length; index++) {
      const handler = this.handlersQueue[index];
      const isRouter = handler instanceof Router;
      if (
        isRouter &&
        typeof requestedPath == 'string' &&
        handler.parsePath(requestedPath, method).isMatched
      ) {
        next = handler;
        break;
      } else if (
        !isRouter &&
        ((handler.method === method && !requestedPath) ||
          handler.method === 'use')
      ) {
        next = (handler as RouteHandler).cb;
        break;
      }
    }

    return next ? { handler: next, index } : undefined;
  }

  _use(handlers: (RouteHandler<R> | Router<CTX>)[]) {
    if (handlers instanceof Array) {
      this.handlersQueue.push(...handlers);
      return;
    }
    this.handlersQueue.push(handlers);
  }

  toString() {
    return `^^ name : ${this.path}\n** handlers.length: ${this.handlersQueue.length}`;
  }
}
