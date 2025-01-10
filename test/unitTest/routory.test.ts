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
jest.mock('../../src/methodRouteManager');
jest.mock('../../src/routerRespond');

import GlobalErrorHandler from '../../src/globalErrorHandler';
import MethodRouteManager from '../../src/methodRouteManager';
import { pathNormalizing } from '../../src/routeParsingUtils';
import Router, { RouteHandlerCallback } from '../../src/router';
import RouterFactory from '../../src/routerFactory';
import Routory, {
  RequestMethods,
  RouterMessage,
  RouterRequest,
  RouterRespond,
} from '../../src/routory';

describe('Router expose the api for handling requested path by the type of request method', () => {
  let router: Routory;
  beforeEach(() => {
    router = new Routory();
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

  describe('All handlers and its context(path and method they handle) pass to _delegatePathParsing', () => {
    let delegatePathParsingSpy: jest.SpyInstance<
      Router,
      [
        p: any,
        t: (Router | RouteHandlerCallback)[],
        method: RequestMethods | 'use',
      ]
    >;
    let delegatePathParsing: (
      p: any,
      t: (Router | RouteHandlerCallback)[],
      method: RequestMethods | 'use',
    ) => Router;

    beforeEach(() => {
      delegatePathParsingSpy = jest.spyOn(
        router as any,
        '_delegatingPathParsing',
      ) as any;

      delegatePathParsing = delegatePathParsingSpy
        .getMockImplementation()!
        .bind(router);
      (MethodRouteManager as jest.Mock).mockClear();
    });

    it('should delegate handling context(path and method) to a router if no router handler provided and register it with _use method', () => {
      // Arrange
      const handlingPath = '/a/b';
      const handlingMethod = RequestMethods.GET;
      const callbackHanlder = jest.fn();
      router._use = jest.fn();

      // Action
      delegatePathParsing(handlingPath, [callbackHanlder], handlingMethod);

      // Assert
      expect(MethodRouteManager).toHaveBeenCalledTimes(1);
      expect(MethodRouteManager).toHaveBeenCalledWith(
        handlingPath,
        handlingMethod,
      );
      expect(router._use).toHaveBeenCalledTimes(1);
      expect(router._use).toHaveBeenCalledWith([
        expect.any(MethodRouteManager),
      ]);
    });
  });

  it(`should register passed routers through [use] method with specified 
    path and reset sub-router path to empty path to accept sub-route paths handler`, () => {
    // Arrange
    const subRouter = new Routory();
    (subRouter as any).path = 'e/f';
    router._use = jest.fn();

    const internalRouter = new Routory(); // router to handle specified path
    jest.spyOn(internalRouter, '_use').mockImplementation(() => {});
    const routerFactoryStub: RouterFactory = {
      create: jest.fn().mockReturnValue(internalRouter),
    }; // factory object for returning intented router
    (router as any).subRouterFactory = routerFactoryStub;

    // Action
    router.use('/a/b/c', subRouter);

    // Assert
    expect((subRouter as any).path).toBe('');
    expect(router._use).toHaveBeenCalledWith([expect.any(Routory)]);
    expect(routerFactoryStub.create).toHaveBeenCalled();
    expect(internalRouter._use).toHaveBeenCalledWith([subRouter]);
  });

  it('should register handlers directly if no path specified', () => {
    // Arrange
    const routerHandler = new Routory();
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

  it('should register global error handler on [error] method', () => {
    // Arrange
    const handler = jest.fn();
    const globalErrManager =
      (GlobalErrorHandler.instance.registerErrorHandlerCallback = jest.fn());

    // Action
    router.handleErrorGlobally(handler);

    // Assert
    expect(globalErrManager).toHaveBeenCalled();
  });

  it('should create new sub-router object with factory and register it and return as reference', () => {
    // Arrange
    const subRouter = new Routory();
    const factory = ((router as any).subRouterFactory.create = jest
      .fn()
      .mockReturnValue(subRouter));

    // Action
    const actualSubRouter = router.route('/x/y/z/');

    // Assert
    expect(factory).toHaveBeenCalledTimes(1);
    expect(actualSubRouter).toBe(subRouter);
    expect(actualSubRouter.path).toBe('x/y/z');
  });

  it('should create restpond object and request object from input message and forward it among with arbitary context object to [Router.handleRequest] and return respond object', () => {
    // Arrange
    const messageStub: RouterMessage = {
      method: RequestMethods.GET,
      url: '/a/b/c',
    };
    const contextStub = { test: 'test-value' };
    const handleMethodSpy = (router.handleRequest = jest.fn());

    // Action
    const respond = router.onMessage(messageStub, contextStub);

    // Assert
    expect(handleMethodSpy).toHaveBeenCalledTimes(1);
    expect(handleMethodSpy).toHaveBeenCalledWith(
      expect.any(RouterRequest),
      expect.any(RouterRespond),
    );
    expect(respond).toBeInstanceOf(RouterRespond);
  });
});
