import GlobalErrorHandler from '../../src/globalErrorHandler';
import { CallbackHandlerParamListType } from './testUtils/types';

describe('Handle errors as globally manner, define error handler and forward errors to them', () => {
  let globalErrHandler: GlobalErrorHandler;
  beforeEach(() => {
    (GlobalErrorHandler as any)._instance = undefined;
    globalErrHandler = GlobalErrorHandler.instance;
  });
  it('should return same error handler if try to access GlobalErrorHandler.instance multiple times (singleton design pattern)', () => {
    // Arrange
    const inst1 = GlobalErrorHandler.instance;
    const inst2 = GlobalErrorHandler.instance;

    // Assert
    expect(inst1).toBe(globalErrHandler);
    expect(inst2).toBe(inst1);
  });
  it('should register error handler callback', () => {
    // Arrange
    const callback = jest.fn();

    // Action
    globalErrHandler.registerErrorHandlerCallback(callback);

    // Assert
    expect((globalErrHandler as any).globalErrHandlerCallbacks).toContain(
      callback,
    );
  });

  const req: any = {};
  const res: any = {};

  it('should triggerErrorHandling invoked by onErrorHandling', () => {
    // Arrange
    const triggerSpy = jest
      .spyOn(globalErrHandler as any, 'triggerErrorHandling')
      .mockImplementation(() => {});

    const err = new Error('test error');

    // Action
    globalErrHandler.onErrorHandling(err, req, res);

    // Assert
    expect(triggerSpy).toHaveBeenCalledTimes(1);
    expect(triggerSpy).toHaveBeenCalledWith(err, req, res);
  });

  it('should run error handlers on row with correct order', () => {
    // Arrange
    let invokeCounter = 0;
    const forwardToNext: (
      err: any,
      _: any,
      __: any,
      next: CallbackHandlerParamListType[2],
    ) => void = (err, req, res, next) => {
      // second callback not invoke next
      if (invokeCounter++ < 1) next();
    };

    function getJestMock() {
      return jest
        .fn<void, [any, any, any, any]>()
        .mockImplementation(forwardToNext);
    }

    const firstCallbackHandler = getJestMock();
    const secondCallbackHandler = getJestMock();
    const thirdCallbackHandler = getJestMock();

    globalErrHandler.registerErrorHandlerCallback(firstCallbackHandler);
    globalErrHandler.registerErrorHandlerCallback(secondCallbackHandler);
    globalErrHandler.registerErrorHandlerCallback(thirdCallbackHandler);

    // Action
    globalErrHandler.onErrorHandling({}, req, res);
    const firstErrHandlerCallOrder =
      firstCallbackHandler.mock.invocationCallOrder[0];
    const secondErrHandlerCallOrder =
      secondCallbackHandler.mock.invocationCallOrder[0];

    // Assert
    expect((globalErrHandler as any).globalErrHandlerCallbacks).toHaveLength(3);
    expect(firstErrHandlerCallOrder).toBeLessThan(secondErrHandlerCallOrder);
    expect(thirdCallbackHandler).not.toHaveBeenCalled();
  });
});
