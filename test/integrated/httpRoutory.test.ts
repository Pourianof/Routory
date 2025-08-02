import {
  HTTPRoutory,
  RequestMethods,
  RouterMessage,
  RouterRequest,
  RouterRespond,
} from '../../src/index';

describe('test HTTPRoutory main router', () => {
  let router: HTTPRoutory;
  let subRouter: HTTPRoutory;
  beforeEach(() => {
    router = new HTTPRoutory();
    subRouter = new HTTPRoutory();
    router.use('/sub', subRouter);
  });

  it.only('should register a GET handler', () => {
    const getHandler = jest.fn();
    router.get('/test', getHandler);

    const message: RouterMessage = {
      method: RequestMethods.GET,
      url: '/test',
    };

    router.onMessage(message, {});

    expect(getHandler).toHaveBeenCalledTimes(1);
  });

  it('should register trigger handler with two path parameter and values', () => {
    const getHandler = jest.fn();

    router.get('/test/:param1/:param2', getHandler);

    const message: RouterMessage = {
      method: RequestMethods.GET,
      url: '/test/value1/value2',
    };

    router.onMessage(message, {});

    expect(getHandler).toHaveBeenCalled();
  });

  it('should trigger each handler only once', async () => {
    // Arrange
    const firstGetHandler = jest.fn().mockImplementation((req, res, next) => {
      next();
    });
    const secondGetHandler = jest
      .fn()
      .mockImplementation((req, res: RouterRespond, next) => {
        res.status(200, 'Ok').json({});
      });

    subRouter.post('/test', firstGetHandler, secondGetHandler);
    subRouter.get('/test', firstGetHandler, secondGetHandler);

    const message: RouterMessage = {
      method: RequestMethods.GET,
      url: '/sub/test',
    };

    // Action
    await router.onMessage(message, {});

    // Assert
    expect(firstGetHandler).toHaveBeenCalledTimes(1);
    expect(secondGetHandler).toHaveBeenCalledTimes(1);
  });
});

describe('test HTTPRoutory sub-router extension', () => {
  const router = new HTTPRoutory();
  const testSubRouter = new HTTPRoutory();

  router.use('/test', testSubRouter);

  const testSRGetHandler = jest.fn();
  const testSRPostHandler = jest.fn();
  testSubRouter.get(testSRGetHandler);
  testSubRouter.post(testSRPostHandler);

  const testPathedGetHandler = jest.fn();
  testSubRouter.get('/pathed', testPathedGetHandler);

  const firstRouterFileGetterHandler = jest.fn();
  const secondRouterFileGetterHandler = jest.fn();

  router.get(
    '/:file-name',
    firstRouterFileGetterHandler,
    secondRouterFileGetterHandler,
  );

  it(`should trigger and invoke the testSubRouter get callback
     handler on *GET /test* request`, () => {
    // Arrange
    const message: RouterMessage = {
      method: RequestMethods.GET,
      url: '/test/pathed',
    };

    // Action
    router.onMessage(message, {});

    // Assert
    expect(testPathedGetHandler).toHaveBeenCalledTimes(1);
  });

  it('should trigger and invoke the router get callback handler on *GET /test* request', () => {
    // Arrange
    const message: RouterMessage = { method: RequestMethods.GET, url: '/test' };

    // Action
    router.onMessage(message, {});

    // Assert
    expect(testSRGetHandler).toHaveBeenCalled();
    expect(testSRPostHandler).not.toHaveBeenCalled();
  });

  it(`should trigger and invoke the testSubRouter get callback
     handler on *GET /test* request`, () => {
    // Arrange
    const message: RouterMessage = { method: RequestMethods.GET, url: '/test' };

    // Action
    router.onMessage(message, {});

    // Assert
    expect(testSRGetHandler).toHaveBeenCalledTimes(1);
    expect(testSRPostHandler).not.toHaveBeenCalled();
  });

  it('should invoke the handlers for */file-name* path', () => {
    // Arrange
    const message: RouterMessage = {
      method: RequestMethods.GET,
      url: '/index.html',
    };

    firstRouterFileGetterHandler.mockImplementationOnce((req, res, next) => {
      next();
    });

    // Action
    router.onMessage(message, {});

    // Assert
    expect(firstRouterFileGetterHandler).toHaveBeenCalledTimes(1);
    expect(secondRouterFileGetterHandler).toHaveBeenCalledTimes(1);
    expect(firstRouterFileGetterHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { 'file-name': 'index.html' },
      }),
      expect.any(RouterRespond),
      expect.any(Function),
    );
  });

  it('should register and trigger the global error handlers', () => {
    // Arrange
    const errHandler = jest
      .fn()
      .mockImplementation((err, req, res, next) => next());
    const secondErrHandler = jest.fn();

    router.handleErrorGlobally(errHandler);
    router.handleErrorGlobally(secondErrHandler);

    firstRouterFileGetterHandler.mockImplementation((req, res, next) => {
      next(new Error('test error'));
    });

    const message: RouterMessage = {
      method: RequestMethods.GET,
      url: '/index.html',
    };

    // Action
    router.onMessage(message, {});

    // Assert
    expect(errHandler).toHaveBeenCalled();
    expect(secondErrHandler).toHaveBeenCalled();
    expect(errHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
    expect(secondErrHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it('should return an awaitable respond object with the actual respond body', async () => {
    // Arrange
    const html = `<h3>Test Html</h3>`;
    firstRouterFileGetterHandler.mockImplementationOnce(
      (req: RouterRequest, res: RouterRespond) => {
        return new Promise<void>((resolver) =>
          setImmediate(() => {
            res.send(html);
            resolver();
          }),
        );
      },
    ); // a handler which do an asyncronous task and then send response and also resolve the promise

    const message: RouterMessage = {
      method: RequestMethods.GET,
      url: '/index.html',
    };

    // Action
    const respond = router.onMessage(message, {});
    respond.onRespond((value) => {
      expect(value.data).toBe(html);
    });
    respond.then((body) => {
      expect(body.data).toBe(html);
    });

    const result = await respond;

    const resultAfterResolve = await respond;

    // Assert
    expect(result).toEqual(resultAfterResolve);
    expect(result.data).toBe(html);
  });
});
