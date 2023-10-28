import Routory from '../src/routory';
import { RequestMethods } from '../src/routerRequest';

const router = new Routory();

router
  .route('/a')
  .get(
    '/c',
    (req, res, next) => {
      console.log('First mw1');
      next();
    },
    (req, res, next) => {
      console.log('Second mw2');
      next();
    },
    (_, __, next) => {
      console.log('third mw3');
      next();
    }
  )
  .use('/:id', (req, res, next) => {
    console.log('*** ID is : ' + req.params.id);
    next();
  });

const testRouter = new Routory();

router.use('/f', testRouter, (req, res, next) => {
  console.log('Mix of router and middleware ...');
});

router.use((req, res, n) => {
  console.log('==== USE METHOD ====');
  n();
});

(async function () {
  router.onMessage(
    {
      url: '/f',
      method: RequestMethods.GET,
    },
    {}
  );
})();
