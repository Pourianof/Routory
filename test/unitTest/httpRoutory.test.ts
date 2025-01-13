jest.mock('../../src/router.ts', () => {
  return class {
    _use() {}
    _path: string = '';
    set path(p: string) {
      this._path = pathNormalizing(p);
    }
    get path() {
      return this._path;
    }
  };
});

import { pathNormalizing } from '../../src/routeParsingUtils';
import HTTPRoutory from '../../src/httpRoutory';
import { RequestMethods } from '../../src/routerRequest';

describe('Router expose the api for handling requested path by the type of request method', () => {
  let router: HTTPRoutory;
  beforeEach(() => {
    router = new HTTPRoutory();
  });

  it('should delegate all methods with same name as available request methods to _delegatingPathParsing', () => {
    // Arrange
    const delegatedSpy = ((router as any)._delegatingPathParsing = jest.fn());

    // Action
    router.get('a');
    router.post('b');
    router.patch('c');
    router.delete('d');
    router.put('e');
    router.use('f');

    // Assert
    expect(delegatedSpy).toHaveBeenCalledTimes(6);
    expect(delegatedSpy).toHaveBeenNthCalledWith(
      1,
      'a',
      expect.any(Array),
      RequestMethods.GET,
    );
    expect(delegatedSpy).toHaveBeenNthCalledWith(
      2,
      'b',
      expect.any(Array),
      RequestMethods.POST,
    );
    expect(delegatedSpy).toHaveBeenNthCalledWith(
      3,
      'c',
      expect.any(Array),
      RequestMethods.PATCH,
    );
    expect(delegatedSpy).toHaveBeenNthCalledWith(
      4,
      'd',
      expect.any(Array),
      RequestMethods.DELETE,
    );
    expect(delegatedSpy).toHaveBeenNthCalledWith(
      5,
      'e',
      expect.any(Array),
      RequestMethods.PUT,
    );
    expect(delegatedSpy).toHaveBeenNthCalledWith(
      6,
      'f',
      expect.any(Array),
      'use',
    );
  });

  it('should register handlers directly if no path specified', () => {
    // Arrange
    const routerHandler = new HTTPRoutory();
    const callbackHandler = jest.fn();
    const callbackHandler2 = jest.fn();

    const _use = (router._use = jest.fn());

    // Action
    router.use(routerHandler, callbackHandler);
    router.get(callbackHandler, callbackHandler2);

    // Assert
    expect(_use).toHaveBeenNthCalledWith(1, [
      routerHandler,
      { cb: callbackHandler, method: 'use' },
    ]);

    expect(_use).toHaveBeenNthCalledWith(2, [
      { cb: callbackHandler, method: 'GET' },
      { cb: callbackHandler2, method: 'GET' },
    ]);
  });
});
