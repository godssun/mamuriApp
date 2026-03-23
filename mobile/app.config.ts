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
      backgroundColor: '#6356D9',
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
