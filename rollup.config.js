const typescript = require('@rollup/plugin-typescript');
const { dts } = require('rollup-plugin-dts');
const terser = require('@rollup/plugin-terser');
const copy = require('rollup-plugin-copy');
const path = require('path');

const isDev = !!process.argv.find((e) => e === '--config-dev');
const destRootDir = path.join('dist', 'routory');
const distBinDir = path.join(destRootDir, 'bin');

/** @type {import('rollup').RollupOptions} */
const config = [
  {
    input: 'src/index.ts',
    output: {
      file: path.join(destRootDir, 'routory.js'),
      format: 'cjs',
      sourcemap: isDev,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
      }),
      terser(),
      copy({
        targets: [
          { src: 'src/package.json', dest: destRootDir },
          {
            src: 'LICENSE',
            dest: destRootDir,
          },
          {
            src: 'Readme.md',
            dest: destRootDir,
          },
        ],
      }),
    ],
  },
  {
    input: 'src/bin/index.ts',
    output: {
      file: path.join(distBinDir, 'index.js'),
      format: 'cjs',
      sourcemap: isDev,
    },
    plugins: [
      typescript({
        compilerOptions: {
          target: 'es2016',
          module: 'nodenext',
          moduleResolution: 'nodenext',
          declaration: false,
          declarationDir: distBinDir,
        },
      }),
      copy({
        targets: [
          { src: 'src/bin/class_template.txt', dest: distBinDir },
          {
            src: 'src/bin/example_http_routory.json',
            dest: distBinDir,
          },
          {
            src: 'src/bin/method_template.txt',
            dest: distBinDir,
          },
        ],
      }),
    ],
  },
  {
    input: path.join(destRootDir, 'compiled', 'index.d.ts'),
    output: {
      file: path.join(destRootDir, 'routory.d.ts'),
      format: 'es',
    },
    plugins: [dts()],
  },
];
module.exports = config;
