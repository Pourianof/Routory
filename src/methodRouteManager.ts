import Router from './router';
import { RequestMethods } from './routerRequest';

/**
 * Represent an absolute path Handler with one method
 */
export default class MethodRouteManager extends Router {
  constructor(
    path: string,
    private method: RequestMethods | 'use'
  ) {
    super();
    this.path = path;
  }

  protected isMatch(p: string, m: RequestMethods): boolean {
    return super.isMatch(p, m) && (this.method === m || this.method === 'use');
  }
  toString(): string {
    return `
    ${super.toString()}
    ## method : ${this.method}
    `;
  }
}
