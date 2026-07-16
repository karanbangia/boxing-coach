const base = require('./app.json');

module.exports = () => {
  const iosUrlScheme = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_URL_SCHEME;
  const plugins = [...base.expo.plugins];

  plugins.push([
    'expo-build-properties',
    {
      ios: {
        extraPods: [
          { name: 'GoogleUtilities', modular_headers: true },
          { name: 'RecaptchaInterop', modular_headers: true },
        ],
      },
    },
  ]);

  if (iosUrlScheme) {
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme },
    ]);
  }

  return {
    ...base.expo,
    plugins,
  };
};
