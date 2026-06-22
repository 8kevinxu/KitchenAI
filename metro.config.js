// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// zustand v5 ships an ESM build (esm/*.mjs) that uses `import.meta`. On Expo
// web the entry bundle runs as a classic script, so `import.meta` throws and
// the app renders a blank screen. Dropping the "import" resolver condition
// makes Metro resolve packages' CommonJS builds instead, which avoids it.
config.resolver.unstable_conditionNames = ['require', 'react-native'];

module.exports = config;
