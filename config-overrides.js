module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
  };

  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });

  return config;
};
