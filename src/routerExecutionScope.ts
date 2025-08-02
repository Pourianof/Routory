import GlobalErrorHandler from './globalErrorHandler';
import { pathNormalizing } from './routeParsingUtils';
import Router, { RequestedPathParseResult } from './router';
import { RouterRequest } from './routerRequest';
import RouterRespond from './routerRespond';

/**
 * A helper class to keep some context data on each request recieve
 * to [Router]s.
 *
 * Actually purpose of class is to remember some context(scope) data
 * which not good decision to save them on router class  and then
 * using them after control of execution return from underlying
 * routers(sub-routers).
 *
 * Data like params [RouterRequest.params] path which could change on sub-routers
 * or [RouterRequest.relativePath].
 */
export default class RouterExecutionScope {
  private index = 0;
  private rp: string;
  constructor(
    private routerDelegate: Router<any, any>,
    private req: RouterRequest,
    private res: RouterRespond,
    private analyseState: RequestedPathParseResult,
    private afterAll?: () => any,
  ) {
    this.rp = pathNormalizing(req.relativePath);
  }

  private populateParams() {
    const params = this.analyseState.params;
    if (params && Object.keys(params).length) {
      Object.keys(params).forEach((key) => {
        this.req.params[key] = params[key];
      });
    }
  }

  private resetRelativePath() {
    this.req.relativePath = this.rp;
  }

  private runNext(err?: any) {
    if (err) {
      GlobalErrorHandler.instance.onErrorHandling(err, this.req, this.res);
      return;
    }
    this.populateParams();
    this.resetRelativePath();

    const handlerResult = this.routerDelegate.getHandlerFor(
      this.req.method,
      this.analyseState.forwardPath,
      this.index,
    );

    if (!handlerResult) {
      this.afterAll?.();
      return;
    }

    const { handler, index } = handlerResult;
    if (this.index <= index) {
      this.index = index + 1;
    } else {
      this.afterAll?.();
    }

    if (handler) {
      if (handler instanceof Router) {
        this.req.relativePath = this.analyseState.forwardPath!;
        handler.handleRequest(this.req, this.res, this.runNext.bind(this));
      } else {
        const waiter = handler(this.req, this.res, this.runNext.bind(this));
        if (waiter instanceof Promise) {
          waiter.catch((err) => {
            this.runNext(err);
          });
        }
      }
    } else if (this.afterAll) {
      this.afterAll();
    }
  }

  run() {
    this.runNext();
  }
}
