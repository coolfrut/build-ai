const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Добавляем поддержку алиасов
config.resolver.alias = {
  '@': __dirname,
};

module.exports = config;
