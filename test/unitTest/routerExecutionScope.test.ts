jest.mock('../../src/router');
jest.mock('../../src/globalErrorHandler', () => {
  return {
    instance: {
      onErrorHandling: jest.fn(),
    },
  };
});

import GlobalErrorHandler from '../../src/globalErrorHandler';

import Router from '../../src/router';

import {
  RequestedPathParseResult,
  RouteHandlerCallback,
} from '../../src/router';

import RouterExecutionScope from '../../src/routerExecutionScope';
import { RequestMethods, RouterRequest } from '../../src/routerRequest';
import {
  CallbackHandlerParamListType,
  RouterRespondMock,
} from './testUtils/types';

class RouterMock extends Router {
  //   getHandlerFor(
  //     method: RequestMethods,
  //     requestedPath?: string,
  //     startFromIndex?: number,
  //   ) {}
  getHandlerFor = jest.fn<
    { handler: RouterMock | RouteHandlerCallback; index: number } | undefined,
    [RequestMethods, string | undefined, number | undefined]
  >();

  handleRequest = jest.fn<void, CallbackHandlerParamListType>();
}

interface RouterExecMembers {
  rp: string;
  index: number;
  routerDelegate: RouterMock;
  req: RouterRequest;
  res: RouterRespondMock;
  analyseState: RequestedPathParseResult;

  populateParams(): void;
  runNext(err?: any): void;
  run(): void;
  resetRelativePath(): void;
  afterAll?: () => any;
}

describe('RouterExecutionScope to define a scope or context to retain or reset scope after changes on undelying execution scopes', () => {
  let execScope: RouterExecMembers;
  let req: RouterRequest;
  let res: RouterRespondMock;
  let routerDelegateMock: RouterMock;

  beforeEach(() => {
    routerDelegateMock = new RouterMock();
    req = new RouterRequest(RequestMethods.DELETE, {}, '', '', {}, {});
    res = new RouterRespondMock();
    execScope = new RouterExecutionScope(
      routerDelegateMock as any,
      req,
      res as any,
      {} as any,
    ) as never as RouterExecMembers;
  });

  it('should populate request object with parameters of current scope', () => {
    // Arrange
    const params = { param1: 'val1', param2: 'val2' };
    execScope.analyseState = { isMatched: false, params };

    // Action
    execScope.populateParams();

    // Assert
    expect(req.params).toEqual(params);
  });

  it('should reset relative path of request object with its scope relative path', () => {
    // Arrange
    req.path = 'other/path';
    execScope.rp = 'main/path';

    // Action
    execScope.resetRelativePath();

    // Assert
    expect(execScope.rp).toBe('main/path');
  });

  it('should call runNext method', () => {
    // Arrange
    const runNextSpy = jest
      .spyOn(execScope, 'runNext')
      .mockImplementation(() => {});

    // Action
    execScope.run();

    // Assert
    expect(runNextSpy).toHaveBeenCalledTimes(1);
  });
  describe('runNext method - core functionality for execution handlers on a row', () => {
    beforeEach(() => {
      routerDelegateMock.getHandlerFor = jest.fn();
    });
    it('should reset and repopulate params', () => {
      // Arrange
      execScope.resetRelativePath = jest.fn();
      execScope.populateParams = jest.fn();

      // Action
      execScope.runNext();

      // Assert
      expect(execScope.resetRelativePath).toHaveBeenCalledTimes(1);
      expect(execScope.populateParams).toHaveBeenCalledTimes(1);
    });

    it('should forward control of execution to its sub-router', () => {
      // Arrange
      const subRouter = new RouterMock();
      routerDelegateMock.getHandlerFor.mockReturnValueOnce({
        handler: subRouter,
        index: 0,
      });

      // Action
      execScope.runNext();

      // Assert
      expect(subRouter.handleRequest).toHaveBeenCalledTimes(1);
      expect(subRouter.handleRequest).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function),
      );
    });

    it('should forward control of execution to its callback handler', () => {
      // Arrange
      const callbackHandler = jest.fn();
      routerDelegateMock.getHandlerFor.mockReturnValueOnce({
        handler: callbackHandler,
        index: 0,
      });

      // Action
      execScope.runNext();

      // Assert
      expect(callbackHandler).toHaveBeenCalledTimes(1);
      expect(callbackHandler).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Function),
      );
    });

    it('should catch the promise returned by callback handler and forward error to global error handler', async () => {
      // Arrange
      const callbackHandler = jest
        .fn()
        .mockRejectedValue(new Error('test error'));
      const runNextSpy = jest.spyOn(execScope, 'runNext');
      routerDelegateMock.getHandlerFor.mockReturnValueOnce({
        handler: callbackHandler,
        index: 0,
      });

      // Action
      execScope.runNext();
      await Promise.resolve();

      // Assert
      expect(callbackHandler).toHaveBeenCalledTimes(1);
      expect(GlobalErrorHandler.instance.onErrorHandling).toHaveBeenCalledTimes(
        1,
      );
      expect(runNextSpy).toHaveBeenNthCalledWith(2, expect.any(Error));
    });

    it('should run afterAll argument if exist and no handler returned', async () => {
      // Arrange
      routerDelegateMock.getHandlerFor.mockReturnValueOnce(undefined);
      execScope.afterAll = jest.fn();

      // Action
      execScope.runNext();

      // Assert
      expect(execScope.afterAll).toHaveBeenCalledTimes(1);
    });

    it('should forward execution control to next handler if any after current handler invoke "next" callback', () => {
      // Arrange
      jest.spyOn(execScope, 'runNext');

      let invokeCounter = 0;

      const forwardToNext: (
        req: CallbackHandlerParamListType[0],
        res: CallbackHandlerParamListType[1],
        next: CallbackHandlerParamListType[2],
      ) => void = (req, res, next) => {
        // second callback not invoke next
        if (invokeCounter++ < 2) next();
      };
      const firstCallbackHandler = jest
        .fn<void, CallbackHandlerParamListType>()
        .mockImplementation(forwardToNext);
      const routerHandler = new RouterMock();
      routerHandler.handleRequest.mockImplementation(forwardToNext);
      const secondCallbackHandler = jest
        .fn<void, CallbackHandlerParamListType>()
        .mockImplementation(forwardToNext);
      const thirdCallbackHandler = jest
        .fn<void, CallbackHandlerParamListType>()
        .mockImplementation(forwardToNext);

      const queue = [
        firstCallbackHandler,
        routerHandler,
        secondCallbackHandler,
        thirdCallbackHandler,
      ];

      routerDelegateMock.getHandlerFor.mockImplementation(() => {
        return { handler: queue[invokeCounter], index: invokeCounter };
      });

      // Action
      execScope.run();

      const firstCallbackHandlerCallOrderIndex =
        firstCallbackHandler.mock.invocationCallOrder[0];
      const routerHandlerReqHandleCallOrderIndex =
        routerHandler.handleRequest.mock.invocationCallOrder[0];
      const secondCallbackHandlerCallOrderIndex =
        secondCallbackHandler.mock.invocationCallOrder[0];

      // Assert
      expect(execScope.runNext).toHaveBeenCalledTimes(3); // 1- init 2,3- forward to next | secondCallbackHandler not invoke next
      expect(firstCallbackHandler).toHaveBeenCalledTimes(1);
      expect(routerHandler.handleRequest).toHaveBeenCalledTimes(1);
      expect(secondCallbackHandler).toHaveBeenCalledTimes(1);
      expect(thirdCallbackHandler).not.toHaveBeenCalled();

      expect(firstCallbackHandlerCallOrderIndex).toBeLessThan(
        routerHandlerReqHandleCallOrderIndex,
      );
      expect(routerHandlerReqHandleCallOrderIndex).toBeLessThan(
        secondCallbackHandlerCallOrderIndex,
      );
    });
  });
});
