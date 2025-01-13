import Router, { RequestedPathParseResult } from './router';
import { RequestMethods } from './routerRequest';

/**
 * Represent an absolute path Handler with one method
 */
export default class MethodRouteManager<
  METHS extends string[] = [],
> extends Router {
  constructor(
    path: string,
    private method: string,
  ) {
    super();
    this.path = path;
  }

  protected parsePath(
    otherPath: string,
    method: RequestMethods,
    options?: { populateParams?: boolean },
  ): RequestedPathParseResult {
    const initialParseResult = super.parsePath(otherPath, method, options);
    initialParseResult.isMatched &&=
      this.method === method || this.method === 'use';

    return initialParseResult;
  }

  toString(): string {
    return `${super.toString()}\n## method : ${this.method}`;
  }
}
