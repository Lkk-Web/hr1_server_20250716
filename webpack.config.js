const path = require('path');

module.exports = (options, webpack) => {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve.alias,
        '@core': path.resolve(__dirname, 'apps/main/src/core'),
        '@common': path.resolve(__dirname, 'apps/main/src/common'),
        '@library': path.resolve(__dirname, 'apps/main/src/library'),
        '@modules': path.resolve(__dirname, 'apps/main/src/modules'),
        '@model': path.resolve(__dirname, 'apps/main/src/model'),
        '@services': path.resolve(__dirname, 'apps/main/src/services'),
      },
    },
  };
};