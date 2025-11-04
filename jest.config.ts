import type { Config } from 'jest';

const config: Config = {
    bail: true,
    clearMocks: true,
    coverageProvider: 'v8',
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['<rootDir>/src/**/*.test.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    globalTeardown: './src/tests/teardown.ts',
    maxWorkers: 1,
};

export default config;
