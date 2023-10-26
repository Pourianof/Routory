import AppRouter from '../src/appRouter';
import RouterRespond from '../src/routerRespond';
import { RequestMethods } from '../src/routerRequest';

const router = new AppRouter();

router.use((req, res, next) => {
  console.log('===== >> USE HANDLER :\n');
  console.log(req.path);
  next();
});

const scheduleRouter = new AppRouter();
scheduleRouter
  .route('/:id')
  .get((req, res: RouterRespond) => {
    const id = req.params.id;
    console.log(' ** id param is >>  ', id);
    res.send({
      message: '\n*Hey you*\n',
      value: 'Hi, world.',
      id,
    });
  })
  .post((req, res: RouterRespond, n) => {
    res.send({
      message: 'Thanks for sending schedule with id >> ' + req.params.id,
    });
  });

router.use('/schedules', scheduleRouter);

// async requesting
globalThis.setTimeout(async () => {
  const result = await router.onMessage(
    {
      url: '/schedules/1',
      method: RequestMethods.GET,
    },
    {}
  );
  console.log('Respond is : ', result);
}, Math.random() * 3000);

globalThis.setTimeout(async () => {
  const result = await router.onMessage(
    {
      url: '/schedules/1',
      method: RequestMethods.POST,
    },
    {}
  );
  console.log('Respond is : ', result);
}, Math.random() * 3000 + 5000);
