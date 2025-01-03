jest.mock('@pourianof/notifier', () => {
  return class {};
});
import { MultipleTimeReponsing } from '../../src/exceptions';
import RouterRespond from '../../src/routerRespond';

describe('Respond class is responsible for handle response data and some event notifying', () => {
  let respond: RouterRespond;
  beforeEach(() => {
    respond = new RouterRespond();
  });

  it('should change the status code and message', () => {
    // Arrange
    const [statusCode, statusMessage] = [50, 'test message'];

    // Action
    respond.status(statusCode, statusMessage);

    // Assert
    expect(respond.statusCode).toBe(statusCode);
    expect(respond.statusMessage).toBe(statusMessage);
  });
  it('should add callback to listen when respond completed', () => {
    // Arrange
    respond.addListener = jest.fn();

    // Action
    respond.onRespond({} as any);

    // Assert
    expect(respond.addListener).toHaveBeenCalledTimes(1);
  });

  it('should provide a well formatted data', () => {
    // Arrange
    const testRepondObj = { a: 12, b: { c: 'test' } };
    (respond as any).respondValue = { ...testRepondObj };

    // Action
    const value = (respond as any).provideFormattedResponseForSending();

    // Assert
    expect(value.data).toEqual(testRepondObj);
  });

  it('should provide a well formatted json data', () => {
    // Arrange
    (respond as any).jsonOutput = true;
    const jsonStringifySpy = jest.spyOn(JSON, 'stringify');

    // Action
    const value = (respond as any).provideFormattedResponseForSending();

    // Assert
    expect(value).toEqual(expect.any(String));
    expect(jsonStringifySpy).toHaveBeenCalledTimes(1);
    jsonStringifySpy.mockRestore();
  });

  it('should finalize response object by the input value and notify listener', () => {
    // Arrange
    const testObjectData = { param1: 'val1', param2: 'val2' };
    const notifierSpy = jest
      .spyOn(respond as any, 'invokeListeners')
      .mockImplementation(() => {});

    // Action
    respond.json(testObjectData);
    const { jsonOutput, respondValue, isDataSended } = respond as any;

    // Assert
    expect(respondValue).toEqual(testObjectData);
    expect(notifierSpy).toHaveBeenCalledTimes(1);
    expect(isDataSended).toBeTruthy();
    expect(jsonOutput).toBeTruthy();
  });

  it('should throw an error if we call finalizer methods(send or json) multiple times', () => {
    // Arrange
    jest.spyOn(respond as any, 'invokeListeners').mockImplementation(() => {});
    const sendSpy = jest.spyOn(respond, 'send');

    // Action
    const wrapper = () => {
      respond.json({});
      respond.send({});
    };

    // Assert
    expect(wrapper).toThrow(MultipleTimeReponsing);
    expect(sendSpy).toHaveBeenCalledTimes(2);
  });

  it('should notify the listeners with sent data and clear the list of waiters for data', () => {
    // Arrange
    respond.trigger = jest.fn();
    respond.clearify = jest.fn();
    (respond as any).provideFormattedResponseForSending = jest
      .fn()
      .mockReturnValue('returned by provider');

    // Action
    (respond as any).invokeListeners();

    // Assert
    expect(respond.trigger).toHaveBeenCalledTimes(1);
    expect(respond.clearify).toHaveBeenCalledTimes(1);
    expect(respond.trigger).toHaveBeenCalledWith(
      expect.any(String),
      'returned by provider',
    );
  });

  it('should notify the listeners which are added after finalizing response object by methods(send or json)', () => {
    // Arrange
    respond.addListener = jest.fn();
    jest.spyOn(respond, 'isDataSended', 'get').mockReturnValue(true);
    const notifierSpy = ((respond as any).invokeListeners = jest.fn());

    // Action
    respond.onRespond({} as any);

    // Assert
    expect(respond.addListener).toHaveBeenCalledTimes(1);
    expect(notifierSpy).toHaveBeenCalledTimes(1);
  });

  it('should provide the data sent to response object by [await] keyword on response object(make Respond Promise-like)', async () => {
    // Arrange
    respond.onRespond = jest.fn().mockImplementation((cb) => {
      cb('data');
    });

    // Action
    const responseData = await respond;

    // Assert
    expect(responseData).toBe('data');
  });
});
