import { RouteHandlerCallback } from './router';
import { RequestMethods, RouterRequest } from './routerRequest';
import Routory from './routory';
import RouterFactory from './routerFactory';

export default class HTTPRoutory<
  CTX extends {} = {},
  R extends RouterRequest<CTX> = RouterRequest<CTX>,
> extends Routory<HTTPRoutory<CTX, R>, CTX, R> {
  constructor() {
    super(new HTTPRoutoryFactory<CTX, R>());
  }

  post(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): HTTPRoutory<CTX, R>;
  post(...routerHandler: RouteHandlerCallback<R>[]): HTTPRoutory<CTX, R>;
  post(path: string, RouteHandlerCallback: HTTPRoutory): HTTPRoutory<CTX, R>;
  post(p: any, ...r: any): HTTPRoutory<CTX, R> {
    return this._delegatingPathParsing(p, r, RequestMethods.POST);
  }

  get(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): HTTPRoutory<CTX, R>;
  get(...routerHandler: RouteHandlerCallback<R>[]): HTTPRoutory<CTX, R>;
  get(p: any, ...r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.GET);
  }

  put(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): HTTPRoutory<CTX, R>;
  put(...routerHandler: RouteHandlerCallback<R>[]): HTTPRoutory<CTX, R>;
  put(p: any, ...r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.PUT);
  }

  patch(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): HTTPRoutory<CTX, R>;
  patch(...routerHandler: RouteHandlerCallback<R>[]): HTTPRoutory<CTX, R>;
  patch(p: any, ...r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.PATCH);
  }

  delete(
    path: string,
    ...RouteHandlerCallback: RouteHandlerCallback<R>[]
  ): HTTPRoutory<CTX, R>;
  delete(...routerHandler: RouteHandlerCallback<R>[]): HTTPRoutory<CTX, R>;
  delete(p: any, ...r: any) {
    return this._delegatingPathParsing(p, r, RequestMethods.DELETE);
  }
}

class HTTPRoutoryFactory<
  CTX extends {} = {},
  R extends RouterRequest<CTX> = RouterRequest<CTX>,
> implements RouterFactory<CTX, R, HTTPRoutory<CTX, R>>
{
  create() {
    return new HTTPRoutory<CTX, R>();
  }
}
