import { RouterRequest } from '../../../src/routerRequest';

export class RouterRespondMock {}

export type CallbackHandlerParamListType = [
  RouterRequest,
  RouterRespondMock,
  VoidFunction,
];
