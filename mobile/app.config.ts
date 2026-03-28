import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: 'Mamuri',
    slug: 'mamuri',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#F4EFEA',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.mamuri.app',
      googleServicesFile: './GoogleService-Info.plist',
      appleTeamId: 'D4X7QXD8Y5',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#3B2D8B',
      },
      edgeToEdgeEnabled: true,
      package: 'com.mamuri.app',
      googleServicesFile: './google-services.json',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: '03e26af8-0c27-4ab6-b351-37fcc1bc2337',
      },
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || '908613731863-qfgpuffbveivnde0n8p6gs83qr07hgf5.apps.googleusercontent.com',
    },
    plugins: [
      'expo-secure-store',
      'expo-font',
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      '@react-native-google-signin/google-signin',
      'expo-apple-authentication',
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '15.1',
            useFrameworks: 'static',
          },
        },
      ],
      './plugins/withFirebaseModularHeaders',
    ],
  };
};
