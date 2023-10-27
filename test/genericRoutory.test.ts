import Routory from '../src/routory';

class MyRoutory extends Routory<{
  hello: string;
  kill: (name: string) => string;
}> {}

const x = new MyRoutory();
x.use((r) => {
  r.context.hello; // is type of { hello: string; kill: (name: string) => string; }
});

const y = new Routory();

y.use((r) => {
  r.context; // is type {}
});
