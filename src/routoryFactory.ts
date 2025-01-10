import RouterFactory from './routerFactory';
import Routory from './routory';

export class RoutoryFactory implements RouterFactory<Routory> {
  create(): Routory {
    return new Routory();
  }
}
