module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: '../../tsconfig.json',
    },
  },

  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/**/*.(test|spec).ts'],
};
