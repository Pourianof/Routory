import AppRouter from '../src/appRouter';
import { RequestMethods } from '../src/routerRequest';

const router = new AppRouter();

router.route('/a').get((req, res, next) => {
  console.log('/a : Routing...');
  next();
});

router.use((req, res, n) => {
  console.log('==== USE METHOD ====');
  n();
});

// ===============================

const subRouter = new AppRouter();

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
      url: '/b/a',
      method: RequestMethods.GET,
    },
    {}
  );
})();
