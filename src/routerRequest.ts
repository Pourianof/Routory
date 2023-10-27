export enum RequestMethods {
  GET = 'GET',
  POST = 'POST',
  PUSH = 'PUSH',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export class RouterRequest<CTX extends {} = {}> {
  constructor(
    public method: RequestMethods,
    public params: any,
    public path: string,
    public relativePath: string, // describe the path which got to this router
    public body: any,
    public context: CTX
  ) {}
}
