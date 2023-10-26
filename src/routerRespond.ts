type Resolver = (val: any) => any;

enum RespondState {
  NOT_RECIEVED,
  RECIEVED,
  DELIVERED,
}

/*
  A semi promise class which flow on routing process until method send invoked.
  We can act this class as a promise in the way using await for waiting for respond (by calling send method).
*/

export default class RouterRespond {
  constructor() {}

  private isDataSended = false;
  private state = RespondState.NOT_RECIEVED;

  statusCode: number = 10;
  statusMessage: string = '';
  status(statusCode: number, message: string) {
    this.statusMessage = message;
    this.statusCode = statusCode;
    return this;
  }
  private jsonOutput = true;

  json(data: any) {
    this.jsonOutput = true;
    this.send(data);
    return this;
  }

  send(data: any) {
    this.respondValue = data;
    this.isDataSended = true;
    this.state = RespondState.RECIEVED;
    this.invokeListeners();
    if (this.resolver) {
      this._send();
    }
  }

  private _send() {
    this.resolver!(this.provideFormattedResponseForSending());
    this.state = RespondState.DELIVERED;
  }

  isResponded() {
    return this.isDataSended;
  }

  private provideFormattedResponseForSending() {
    const response = {
      data: this.respondValue,
      status: { code: this.statusCode, message: this.statusMessage },
    };
    return this.jsonOutput ? JSON.stringify(response) : response;
  }

  private respondValue: any;
  private resolver?: Resolver;

  then(res: Resolver) {
    this.resolver = res;
    if (this.isDataSended) {
      this._send();
    }
  }

  private invokeListeners() {
    Array.from(this.respondListeners.values()).forEach((l) => {
      l(this.respondValue);
    });
    this.respondListeners.clear();
  }

  private respondListeners: Map<number, (r: any) => any> = new Map();
  // Allow other part of programs to listen when a respond sent
  onRespond(listener: (r: any) => any) {
    const id = this.respondListeners.size;
    this.respondListeners.set(id, listener);
    return id;
  }
}
