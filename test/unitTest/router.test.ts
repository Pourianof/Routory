jest.mock('../../src/routerExecutionScope');
import RouterExecutionScope from '../../src/routerExecutionScope';
import Router, { RequestedPathParseResult } from '../../src/router';
import { RequestMethods, RouterRequest } from '../../src/routerRequest';
import { HandleUnMachedRoutePathException } from '../../src/exceptions';

type HandlerCBMockType = jest.Mock<
  void,
  [RouterRequest, RouterRespondMock, VoidFunction]
>;
class RouterRespondMock {}

class RouterConcreteSUT extends Router {
  public parsePath(
    p: string,
    method: RequestMethods,
    options?: { populateParams?: boolean },
  ): RequestedPathParseResult {
    return super.parsePath(p, method, options);
  }
  public set path(p: string) {
    super.path = p;
  }
  public get path() {
    return super.path;
  }

  public handleRequest(
    req: RouterRequest,
    res: RouterRespondMock,
    afterAll?: () => any,
  ) {
    super.handleRequest(req, res as any, afterAll);
  }
  public _hasParam() {
    return this.hasParam;
  }
}

describe('Routory routering base engine test', () => {
  describe('Router instance base engine', () => {
    let routerSUT: RouterConcreteSUT;
    beforeEach(() => {
      routerSUT = new RouterConcreteSUT();
      routerSUT.path = '/a/b/';
    });

    it('should return true for multipart path', () => {
      // Action
      const isMultiPart = routerSUT.isMultiPart;
      // Assert
      expect(isMultiPart).toBeTruthy();
    });

    it('should should return false for singlepart path', () => {
      // Arrange
      routerSUT.path = '/a/';
      // Action
      const isMultiPart = routerSUT.isMultiPart;
      // Assert
      expect(isMultiPart).toBeFalsy();
    });

    describe('Router.parsePath check is input route path belong to router path', () => {
      it('should not match if input route path not normalized', () => {
        // arrrange

        // actual
        const hasMatched = routerSUT.parsePath('/a/b/c/', RequestMethods.POST);

        //assert
        expect(hasMatched.isMatched).toBeFalsy();
        expect(hasMatched.forwardPath).toBeUndefined();
      });

      it('should match if router path is sub-route path of normalized input path', () => {
        // arrrange
        routerSUT.path = '/a/b/';

        // actual
        const hasMatched = routerSUT.parsePath('a/b/c', RequestMethods.POST);

        //assert
        expect(hasMatched).toEqual<RequestedPathParseResult>({
          isMatched: true,
          forwardPath: 'c',
        });
      });

      it('should not match if input path is not sub-path of router path', () => {
        // arrrange
        routerSUT.path = '/a/b/';

        // actual
        const hasMatched = routerSUT.parsePath('a/a2/b', RequestMethods.POST);

        //assert
        expect(hasMatched).toEqual<RequestedPathParseResult>({
          isMatched: false,
          forwardPath: undefined,
        });
        expect(hasMatched.params).toBeUndefined();
      });

      it('should match if router path has param', () => {
        // arrrange
        routerSUT.path = '/a/:b/';

        // actual
        const hasMatched = routerSUT.parsePath(
          'a/My_random_text/c',
          RequestMethods.POST,
        );

        //assert
        expect(hasMatched.isMatched).toBeTruthy();
        expect(hasMatched.forwardPath).toBe('c');
      });
      it('should not match if router path has param but is not sub-path of input path', () => {
        // arrrange
        routerSUT.path = '/a/:b/c';

        // actual
        const hasMatched = routerSUT.parsePath(
          'a/My_random_text/d',
          RequestMethods.POST,
        );

        //assert
        expect(hasMatched.isMatched).toBeFalsy();
        expect(hasMatched.forwardPath).toBeUndefined();
      });

      it('should return the cached parse result on duplicate request path', () => {
        // arrrange
        const requestedPath = 'a/b/c/d';

        let _cachedParse: RequestedPathParseResult | undefined;
        const routerParsdCachePropGetter = jest.fn().mockImplementation(() => {
          return _cachedParse;
        });
        const routerParsedCachePropSetter = jest
          .fn()
          .mockImplementation((val: RequestedPathParseResult) => {
            _cachedParse = val;
          });

        Object.defineProperty(routerSUT, 'cachedParse', {
          get: routerParsdCachePropGetter,
          set: routerParsedCachePropSetter,
        });

        // actual
        const firstAttemptResult = routerSUT.parsePath(
          requestedPath,
          RequestMethods.POST,
        );
        const secondAttemptResult = routerSUT.parsePath(
          requestedPath,
          RequestMethods.POST,
        );

        //assert
        expect(firstAttemptResult).toBe(secondAttemptResult);
        expect(routerParsedCachePropSetter).toHaveBeenCalledWith<
          [
            {
              requestedPath: string;
              result: RequestedPathParseResult;
            },
          ]
        >({ requestedPath, result: { isMatched: true, forwardPath: 'c/d' } });
      });

      it('should store params in parse result', () => {
        // Arrange
        const requestedPath = 'a/first-value/c/second-value/d/e';
        routerSUT.path = 'a/:first-param/c/:second-param/d';

        // Action
        const actualParse = routerSUT.parsePath(
          requestedPath,
          RequestMethods.PUT,
          {
            populateParams: true,
          },
        );

        // Assert
        expect(actualParse).toHaveProperty('params');
        expect(actualParse.params).toEqual({
          'first-param': 'first-value',
          'second-param': 'second-value',
        });
      });
    });

    describe('Router.handleRequest handle incoming request to forward it to waiting handlers', () => {
      let requestObj: RouterRequest;
      let respondObj: RouterRespondMock;
      beforeEach(() => {
        requestObj = new RouterRequest(
          RequestMethods.PUT,
          {},
          '/a/b/',
          '/a/b/',
          {},
          {},
        );

        respondObj = new RouterRespondMock();
      });

      it('should throw error if requested path not matched', () => {
        // Arrange
        const parsePathMock = jest
          .spyOn(routerSUT, 'parsePath')
          .mockReturnValue({
            isMatched: false,
          });

        // Action
        const wrapper = () => {
          routerSUT.handleRequest(requestObj, respondObj);
        };

        // Assert
        expect(wrapper).toThrow(HandleUnMachedRoutePathException);
        expect(parsePathMock).toHaveBeenCalled();
      });

      it('should delegate actual execution of handlers by create and run execution scope when request path matched', () => {
        // Action
        routerSUT.handleRequest(requestObj, respondObj);

        // Assert
        expect((routerSUT as any).cachedParse).toBeDefined();
        expect((routerSUT as any).cachedParse.result.isMatched).toBeTruthy();

        expect(RouterExecutionScope).toHaveBeenCalledTimes(1);
        expect(RouterExecutionScope).toHaveBeenCalledWith(
          routerSUT,
          requestObj,
          respondObj,
          {
            isMatched: true,
            forwardPath: expect.any(String),
          },
          undefined,
        );
        expect(RouterExecutionScope.prototype.run).toHaveBeenCalledTimes(1);
      });
    });

    describe('Router._use is main api to register handlers', () => {
      it('should register single handler', () => {
        // Arrange
        const handlerStub: any = {};

        // Action
        routerSUT._use(handlerStub);

        // Assert
        expect((routerSUT as any).handlersQueue).toHaveLength(1);
        expect((routerSUT as any).handlersQueue).toContain(handlerStub);
      });

      it('should register array of handlers', () => {
        // Arrange
        const handlerStub1: any = {};
        const handlerStub2: any = {};
        const handlerArray = [handlerStub1, handlerStub2];

        // Action
        routerSUT._use(handlerArray);

        // Assert
        expect((routerSUT as any).handlersQueue).toEqual(handlerArray);
      });
    });

    describe('Router.getHandlerFor api for expose appropriate handler for incoming request', () => {
      let getCBHandler: HandlerCBMockType, postCBHandler: HandlerCBMockType;
      let useCBHandler: HandlerCBMockType;

      let subRouter: RouterConcreteSUT;
      beforeEach(() => {
        getCBHandler = jest.fn();
        postCBHandler = jest.fn();
        useCBHandler = jest.fn();
        subRouter = new RouterConcreteSUT();

        routerSUT._use([
          {
            cb: getCBHandler,
            method: RequestMethods.DELETE,
          },
          subRouter,
          {
            cb: postCBHandler,
            method: RequestMethods.POST,
          },
          { cb: useCBHandler, method: 'use' },
        ]);
      });
      it('should not return callback handler if there is any requested path and callback associate with a RequestMethod other than "use"', () => {
        // Arrange
        const requestedPath = '/a';
        jest
          .spyOn(subRouter, 'parsePath')
          .mockReturnValue({ isMatched: false });

        // Action
        const handler = routerSUT.getHandlerFor(
          RequestMethods.POST,
          requestedPath,
        );

        // Assert
        expect(handler).not.toBe(postCBHandler);
      });

      it('should return "use" type callback handler even if there is request path', () => {
        // Arrange
        const requestedPath = '/a';
        jest
          .spyOn(subRouter, 'parsePath')
          .mockReturnValue({ isMatched: false });

        // Action
        const handler = routerSUT.getHandlerFor(
          RequestMethods.POST,
          requestedPath,
          0,
        ); // Assert

        // Assert
        expect(handler).toBe(useCBHandler);
      });

      it('should return first matched of callback handler with specific method', () => {
        // Arrange
        jest
          .spyOn(subRouter, 'parsePath')
          .mockReturnValue({ isMatched: false });

        // Action
        const handler = routerSUT.getHandlerFor(RequestMethods.POST);

        // Assert
        expect(handler).toBe(postCBHandler);
      });

      it('should return sub-router handler if it match with requested path', () => {
        // Arrange
        const requestedPath = '';
        jest.spyOn(subRouter, 'parsePath').mockReturnValue({ isMatched: true });

        // Action
        const handler = routerSUT.getHandlerFor(
          RequestMethods.POST,
          requestedPath,
          0,
        );
        // Assert
        expect(handler).toBe(subRouter);
      });

      it('should not return sub-router handler if no request path exist', () => {
        // Arrange
        jest.spyOn(subRouter, 'parsePath').mockReturnValue({ isMatched: true });

        // Action
        const handler = routerSUT.getHandlerFor(RequestMethods.POST);

        // Assert
        expect(handler).not.toBe(subRouter);
      });

      it('should return handler after specified index even there is match handler before that', () => {
        // Arrange
        const requestedPath = '';
        const index = 2;
        jest.spyOn(subRouter, 'parsePath').mockReturnValue({ isMatched: true });

        // Action
        const handler1 = routerSUT.getHandlerFor(
          RequestMethods.GET,
          requestedPath,
          index,
        );

        const handler2 = routerSUT.getHandlerFor(
          RequestMethods.POST,
          requestedPath,
          index,
        );

        // Assert
        expect(handler1).toBe(useCBHandler);
        expect(handler2).toBe(postCBHandler);
      });
    });

    it('should return formated representation of router', () => {
      // Action
      const result = routerSUT.toString();
      // Assert
      expect(result).toBe(`^^ name : a/b\n** handlers.length: 0`);
    });
  });
});
