import Router from './router';
import { RouterRequest } from './routerRequest';

export default interface RouterFactory<
  CTX extends {} = {},
  R extends RouterRequest<CTX> = RouterRequest<CTX>,
  T extends Router<CTX, R> = Router<CTX, R>,
> {
  create(): T;
}
