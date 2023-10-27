import Routory from '../src/routory';
import { RequestMethods } from '../src/routerRequest';

const router = new Routory();

router.route('/a').get('/c', (req, res, next) => {
  console.log('$-> GET : /a/c');
  next();
});

router.use((req, res, n) => {
  console.log('==== USE METHOD ====');
  n();
});

// ===============================

const subRouter = new Routory();

router.use('/b', subRouter); // METHOD /b

subRouter.get('/a', (_, __, next) => {
  console.log('GET /a/b : Yeah');
  next();
});

subRouter.route('/:id').get((req, _, next) => {
  console.log('**** Params: ', req.params);
  next();
});

router.use((req, res, next) => {
  console.log('+++++ Last use on root router++++');
  console.log('!Params: ', req.params);
});

(async function () {
  router.onMessage(
    {
      url: '/a/c',
      method: RequestMethods.GET,
    },
    {}
  );
})();
