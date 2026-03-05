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
import { LoginScreenV2 } from '../screens_v2/LoginScreenV2';
import { SignupScreenV2 } from '../screens_v2/SignupScreenV2';
import { DiaryListScreenV2 } from '../screens_v2/DiaryListScreenV2';
import { DiaryWriteScreenV2 } from '../screens_v2/DiaryWriteScreenV2';
import { DiaryDetailScreenV2 } from '../screens_v2/DiaryDetailScreenV2';
import { AICommentScreenV2 } from '../screens_v2/AICommentScreenV2';

// V2 Screens (migrated)
import { CompanionScreenV2 } from '../screens_v2/CompanionScreenV2';
import { SettingsScreenV2 } from '../screens_v2/SettingsScreenV2';
import { PaywallScreenV2 } from '../screens_v2/PaywallScreenV2';
import { SubscriptionScreenV2 } from '../screens_v2/SubscriptionScreenV2';
import { CompanionSetupScreenV2 } from '../screens_v2/CompanionSetupScreenV2';
import { DiaryArchiveScreenV2 } from '../screens_v2/DiaryArchiveScreenV2';
import { CustomTabBar } from '../screens_v2/components/CustomTabBar';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const DiaryStack = createNativeStackNavigator<DiaryStackParamList>();

// 인증 스택
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreenV2} />
      <AuthStack.Screen name="Signup" component={SignupScreenV2} />
    </AuthStack.Navigator>
  );
}

// 일기 스택
function DiaryNavigator() {
  return (
    <DiaryStack.Navigator screenOptions={{ headerShown: false }}>
      <DiaryStack.Screen name="DiaryListHome" component={DiaryListScreenV2} />
      <DiaryStack.Screen name="WriteDiary" component={DiaryWriteScreenV2} />
      <DiaryStack.Screen name="DiaryDetail" component={DiaryDetailScreenV2} />
      <DiaryStack.Screen name="AIComment" component={AICommentScreenV2} />
    </DiaryStack.Navigator>
  );
}

// 메인 탭 (일기 + AI 친구)
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
        name="DiaryList"
        component={DiaryNavigator}
        options={{ title: '일기' }}
      />
      <MainTab.Screen
        name="Companion"
        component={CompanionScreenV2}
        options={{ title: tabLabel }}
      />
    </MainTab.Navigator>
  );
}

// 메인 스택 (탭 + 설정 + 온보딩)
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
          <MainStack.Screen name="Paywall" component={PaywallScreenV2} />
          <MainStack.Screen name="Subscription" component={SubscriptionScreenV2} />
          <MainStack.Screen name="DiaryArchive" component={DiaryArchiveScreenV2} />
          <MainStack.Screen name="DiaryDetailFromArchive" component={DiaryDetailScreenV2 as any} />
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
