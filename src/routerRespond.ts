import Notifier from '@pourianof/notifier';
import RouterRespondMessage from './routerRespondMessage';
import { MultipleTimeReponsing } from './exceptions';

export interface ResponseFormat {
  status: { code: number; message: string };
  data: any;
}
type Resolver = (val: ResponseFormat) => any;

enum RespondState {
  NOT_RECIEVED,
  RECIEVED,
  DELIVERED,
}

/*
  A semi promise class which flow on routing process until method send invoked.
  We can act this class as a promise in the way using await for waiting for respond (by calling send method).
*/

export default class RouterRespond extends Notifier<'onrespond'> {
  constructor() {
    super();
  }

  private state = RespondState.NOT_RECIEVED;
  get isDataSended() {
    return this.state == RespondState.RECIEVED;
  }

  statusCode: number = 10;
  statusMessage: string = '';
  status(statusCode: number, message: string) {
    this.statusMessage = message;
    this.statusCode = statusCode;
    return this;
  }
  private jsonOutput = false;

  json(data: any) {
    this.jsonOutput = true;
    this.send(data);
    return this;
  }

  send(data: any) {
    if (this.state == RespondState.RECIEVED) {
      throw new MultipleTimeReponsing();
    }

    this.respondValue = data;
    this.state = RespondState.RECIEVED;
    this.invokeListeners();
  }

  private provideFormattedResponseForSending(): RouterRespondMessage | string {
    const response: ResponseFormat = {
      data: this.respondValue,
      status: { code: this.statusCode, message: this.statusMessage },
    };
    return this.jsonOutput ? JSON.stringify(response) : response;
  }

  private respondValue: any;

  then(res: Resolver) {
    this.onRespond(res);
    return this;
  }

  private invokeListeners() {
    this.trigger('onrespond', this.provideFormattedResponseForSending());
    this.clearify('onrespond');
  }

  // Allow other part of programs to listen when a respond sent
  onRespond(listener: Resolver) {
    this.addListener('onrespond', (event) => {
      listener(event.data);
    });
    if (this.isDataSended) {
      this.invokeListeners();
    }
  }
}
