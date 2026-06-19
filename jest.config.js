/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  verbose: true,
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts'],
};

module.exports = config;
