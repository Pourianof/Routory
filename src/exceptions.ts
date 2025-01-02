export class RoutoryException extends Error {}

export class HandleUnMachedRoutePathException extends RoutoryException {
  constructor(
    public readonly requestedPath: string,
    public readonly expectedPath: string,
  ) {
    super();
  }
}
