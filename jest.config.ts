import type { Config } from 'jest';

const baseDir = '<rootDir>/src';
const baseTestDir = '<rootDir>/test';

const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [`${baseDir}/**/*.ts`],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['\\\\node_modules\\\\'],
  coverageProvider: 'v8',
  preset: 'ts-jest',
  testMatch: [
    `${baseTestDir}/unitTest/*.test.ts`,
    `${baseTestDir}/integrated/*.test.ts`,
  ],
  testPathIgnorePatterns: ['\\\\node_modules\\\\'],
};

export default config;
