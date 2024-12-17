import Routory from '../src/routory';
import { RequestMethods, RouterRequest } from '../src/routerRequest';
import RouterRespond from '../src/routerRespond';

const router = new Routory();

router.use(
  (err: any, req: RouterRequest, res: RouterRespond, next: () => any) => {
    console.log(err);
    next();
  },
);
router.use(
  (err: any, req: RouterRequest, res: RouterRespond, next: () => any) => {
    console.log('2. Second Error handling.');
  },
);
router.get('/a/b', (req, res, next) => {
  console.log('path : /a/b');
  return new Promise((res, rej) => {
    setTimeout(() => rej('Rejected promise.'), Math.random() * 2000);
  });
});

globalThis.setTimeout(() => {
  router.onMessage({ method: RequestMethods.GET, url: '/a/b' }, {});
}, 1000);
