import Routory, {
  RequestMethods,
  RouterMessage,
  RouterRequest,
  RouterRespond,
} from '../../src/routory';

describe('Routory', () => {
  const router = new Routory();
  const testSubRouter = new Routory();

  router.use('/test', testSubRouter);

  const testSRGetHandler = jest.fn();
  const testSRPostHandler = jest.fn();
  testSubRouter.get(testSRGetHandler);
  testSubRouter.post(testSRPostHandler);

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
    const message: RouterMessage = { method: RequestMethods.GET, url: '/test' };

    // Action
    router.onMessage(message, {});

    // Assert
    expect(testSRGetHandler).toHaveBeenCalled();
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
