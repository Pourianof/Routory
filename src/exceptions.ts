export class RoutoryException extends Error {}

export class HandleUnMachedRoutePathException extends RoutoryException {
  constructor(
    public readonly requestedPath: string,
    public readonly expectedPath: string,
  ) {
    super();
  }
}

export class MultipleTimeReponsing extends RoutoryException {
  constructor() {
    super(
      'The [send] method is a finalizer method which means it can be called once per response object',
    );
  }
}
