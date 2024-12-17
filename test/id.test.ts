import Routory, { RouterRespond } from '../src/routory';
import { RequestMethods, RouterRequest } from '../src/routerRequest';

const router = new Routory();

router.route('/a').get('/c', (req, res, next) => {
  console.log('$-> GET : /a/c');
  next();
});

// ===============================

const subRouter = new Routory();

router.use('/b', subRouter); // METHOD /b

subRouter
  .route('/:id/')
  .delete((req: RouterRequest, res: RouterRespond, next: () => any) => {
    console.log('DELETING ....', req.params.id);
  });

(async function () {
  router.onMessage(
    {
      url: '/b/15546',
      method: RequestMethods.DELETE,
    },
    {},
  );
})();
