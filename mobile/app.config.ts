import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: 'Mamuri',
    slug: 'mamuri',
    version: '2.3.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
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
        backgroundColor: '#F4EFEA',
      },
      softwareKeyboardLayoutMode: 'resize',
      package: 'com.junsapps.mamuri',
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
      [
        // SDK 56에서 최상위 `splash` 설정이 제거되어 플러그인으로 이전.
        // enableFullScreenImage_legacy: 기존 top-level splash(contain, 전체 화면)
        // 동작을 보존하기 위해 설정.
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#F4EFEA',
          enableFullScreenImage_legacy: true,
        },
      ],
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
            deploymentTarget: '16.4',
            useFrameworks: 'static',
          },
        },
      ],
      './plugins/withFirebaseModularHeaders',
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: 'ca-app-pub-1553144894464526~4110051841',
          iosAppId: 'ca-app-pub-1553144894464526~1709408384',
        },
      ],
    ],
  };
};
