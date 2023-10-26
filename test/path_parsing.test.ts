import AppRouter from '../src/appRouter';

const router = new AppRouter();

router.route('/a/b').get((re, res, n) => {
  console.log('Req path is : ', re.path);
  n();
});

// =============================== Sub program ==========================
const mySubRouter = new AppRouter();

router.use('/a/c/f', mySubRouter);
