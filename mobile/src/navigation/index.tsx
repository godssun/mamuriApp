import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeV2 } from '../design-system-v2';
import { companionApi } from '../api/client';
import {
  RootStackParamList,
  AuthStackParamList,
  MainStackParamList,
  MainTabParamList,
  DiaryStackParamList,
} from '../types';

// V2 Screens
import { WelcomeScreen } from '../screens_v2/WelcomeScreen';
import { LoginScreenV2 } from '../screens_v2/LoginScreenV2';
import { SignupScreenV2 } from '../screens_v2/SignupScreenV2';
import { SocialNicknameScreenV2 } from '../screens_v2/SocialNicknameScreenV2';
import { DiaryListScreenV2 } from '../screens_v2/DiaryListScreenV2';
import { AICommentScreenV2 } from '../screens_v2/AICommentScreenV2';

// V2 Screens (migrated)
import { SettingsScreenV2 } from '../screens_v2/SettingsScreenV2';
import { CompanionSetupScreenV2 } from '../screens_v2/CompanionSetupScreenV2';
import { DiaryArchiveScreenV2 } from '../screens_v2/DiaryArchiveScreenV2';
import ReportDetailScreenV2 from '../screens_v2/ReportDetailScreenV2';
import { CustomTabBar } from '../screens_v2/components/CustomTabBar';

// V3 Screens
import HomeStickerScreenV3 from '../screens_v2/HomeStickerScreenV3';
import EmotionPickerScreenV3 from '../screens_v2/EmotionPickerScreenV3';
import EmotionCalendarV3 from '../screens_v2/EmotionCalendarV3';
import DiaryCanvasEditorV3 from '../screens_v2/DiaryCanvasEditorV3';
import DiaryPageDetailV3 from '../screens_v2/DiaryPageDetailV3';
import CompanionChatV3 from '../screens_v2/CompanionChatV3';
import ReflectionStoryV3 from '../screens_v2/ReflectionStoryV3';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const DiaryStack = createNativeStackNavigator<DiaryStackParamList>();

// 인증 스택
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreenV2} />
      <AuthStack.Screen name="Signup" component={SignupScreenV2} />
      <AuthStack.Screen name="SocialNickname" component={SocialNicknameScreenV2} />
    </AuthStack.Navigator>
  );
}

// 일기 스택 (V3 화면 사용)
function DiaryNavigator() {
  return (
    <DiaryStack.Navigator screenOptions={{ headerShown: false }}>
      <DiaryStack.Screen name="DiaryListHome" component={DiaryListScreenV2} />
      <DiaryStack.Screen name="WriteDiary" component={DiaryCanvasEditorV3 as any} />
      <DiaryStack.Screen name="DiaryDetail" component={DiaryPageDetailV3 as any} />
      <DiaryStack.Screen name="AIComment" component={AICommentScreenV2} />
    </DiaryStack.Navigator>
  );
}

// 메인 탭 (V3 화면으로 교체)
function MainTabsNavigator() {
  const { companionName, setCompanionName } = useAuth();

  React.useEffect(() => {
    if (!companionName) {
      companionApi.getProfile()
        .then((profile) => setCompanionName(profile.aiName))
        .catch(() => {});
    }
  }, []);

  const tabLabel = companionName || '친구';

  return (
    <MainTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <MainTab.Screen
        name="Home"
        component={HomeStickerScreenV3}
        options={{ title: '홈' }}
      />
      <MainTab.Screen
        name="DiaryList"
        component={DiaryNavigator}
        options={{ title: '일기' }}
      />
      <MainTab.Screen
        name="Companion"
        component={CompanionChatV3}
        options={{ title: tabLabel }}
      />
      <MainTab.Screen
        name="Reflect"
        component={ReflectionStoryV3}
        options={{ title: '돌아보기' }}
      />
    </MainTab.Navigator>
  );
}

// 메인 스택 (V3 화면 포함)
function MainNavigator() {
  const { isNewUser } = useAuth();

  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      {isNewUser ? (
        <MainStack.Screen name="CompanionSetup" component={CompanionSetupScreenV2} />
      ) : (
        <>
          <MainStack.Screen name="MainTabs" component={MainTabsNavigator} />
          <MainStack.Screen name="Settings" component={SettingsScreenV2} />
          <MainStack.Screen name="DiaryArchive" component={DiaryArchiveScreenV2} />
          <MainStack.Screen name="DiaryDetailFromArchive" component={DiaryPageDetailV3 as any} />
          <MainStack.Screen name="ReportDetail" component={ReportDetailScreenV2 as any} />
          <MainStack.Screen name="EmotionCalendar" component={EmotionCalendarV3 as any} />
          <MainStack.Screen name="EmotionPicker" component={EmotionPickerScreenV3 as any} />
        </>
      )}
    </MainStack.Navigator>
  );
}

// 루트 네비게이션
export default function Navigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useThemeV2();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>마무리</Text>
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 32,
    fontWeight: '700',
  },
});
