jest.mock('../../src/router', () => {
  return class {
    parsePath() {
      return { isMatched: true };
    }

    toString() {
      return '[super result]';
    }
  };
});
import MethodRouteManager from '../../src/methodRouteManager';
import { RequestMethods } from '../../src/routerRequest';

class MethodRouteManagerExt extends MethodRouteManager {
  set meth(val: RequestMethods | 'use') {
    (this as any).method = val;
  }
}

describe('Upgrade the matching logic to check the requested method too', () => {
  let methodRouter: MethodRouteManagerExt;

  beforeEach(() => {
    methodRouter = new MethodRouteManagerExt('', {} as any);
  });
  it('should intercept the parsing requested path and check the request method too', () => {
    // Arrange
    methodRouter.meth = RequestMethods.GET;

    // Action
    const result = (methodRouter as any).parsePath('', RequestMethods.POST);
    const result2 = (methodRouter as any).parsePath('', RequestMethods.GET);

    // Assert
    expect(result.isMatched).toBeFalsy();
    expect(result2.isMatched).toBeTruthy();
  });

  it('should match with any requested methods if the router method set to "use"', () => {
    // Arrange
    methodRouter.meth = 'use';

    // Action
    const result = (methodRouter as any).parsePath('', RequestMethods.DELETE);

    // Assert
    expect(result.isMatched).toBeTruthy();
  });

  it('should extends toString formatting to include method router method name', () => {
    // Arrange
    methodRouter.meth = RequestMethods.PATCH;
    // Action
    const toStringResult = methodRouter.toString();
    // Assert
    expect(toStringResult).toBe('[super result]\n## method : PATCH');
  });
});
