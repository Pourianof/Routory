import { RequestMethods } from './routerRequest';

export default interface RouterMessage {
  method: RequestMethods;
  url: string;
  data?: any;
}
