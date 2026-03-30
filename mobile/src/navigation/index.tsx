import React from 'react';
import { NavigationContainer, CommonActions, StackActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { colors as v3Colors, fontFamily as v3FontFamily } from '../design-system-v3';
import { companionApi } from '../api/client';
import {
  RootStackParamList,
  AuthStackParamList,
  MainStackParamList,
  MainTabParamList,
  DiaryStackParamListV3,
} from '../types';

// V3 Screens
import { WelcomeScreenV3 as WelcomeScreen } from '../screens_v2/WelcomeScreenV3';
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
import PaywallScreenV3 from '../screens_v2/PaywallScreenV3';
import CustomStickerScreenV3 from '../screens_v2/CustomStickerScreenV3';
import ReflectionStoryV3 from '../screens_v2/ReflectionStoryV3';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const DiaryStack = createNativeStackNavigator<DiaryStackParamListV3>();

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
      <DiaryStack.Screen name="DiaryListHome" component={DiaryListScreenV2 as any} />
      <DiaryStack.Screen name="WriteDiary" component={DiaryCanvasEditorV3} />
      <DiaryStack.Screen name="DiaryDetail" component={DiaryPageDetailV3} />
      <DiaryStack.Screen name="AIComment" component={AICommentScreenV2 as any} />
    </DiaryStack.Navigator>
  );
}

// 메인 탭 (V3 화면으로 교체)
function MainTabsNavigator() {
  const { t } = useTranslation();
  const { companionName, setCompanionName } = useAuth();

  React.useEffect(() => {
    if (!companionName) {
      companionApi.getProfile()
        .then((profile) => setCompanionName(profile.aiName))
        .catch(() => {});
    }
  }, []);

  const tabLabel = companionName || t('tabs.companion');

  return (
    <MainTab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <MainTab.Screen
        name="Home"
        component={HomeStickerScreenV3}
        options={{ title: t('tabs.home') }}
      />
      <MainTab.Screen
        name="DiaryList"
        component={DiaryNavigator}
        options={{ title: t('tabs.diary') }}
        listeners={({ navigation: tabNav }) => ({
          tabPress: (e: any) => {
            // 탭 클릭 시 DiaryStack을 DiaryListHome까지 pop
            e.preventDefault();
            (tabNav as any).navigate('DiaryList', {
              screen: 'DiaryListHome',
            });
            // 스택에 WriteDiary/DiaryDetail이 남아있으면 popToTop
            try {
              tabNav.dispatch(StackActions.popToTop());
            } catch {
              // 이미 root이면 무시
            }
          },
        })}
      />
      <MainTab.Screen
        name="Reflect"
        component={ReflectionStoryV3}
        options={{ title: t('tabs.reflect') }}
      />
      <MainTab.Screen
        name="Companion"
        component={CompanionChatV3}
        options={{ title: tabLabel }}
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
          <MainStack.Screen name="Paywall" component={PaywallScreenV3} options={{ presentation: 'modal' }} />
          <MainStack.Screen name="CustomSticker" component={CustomStickerScreenV3} />
        </>
      )}
    </MainStack.Navigator>
  );
}

// 루트 네비게이션
export default function Navigation() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: v3Colors.bgCream }]}>
        <Text style={[styles.loadingText, { color: v3Colors.textPrimary, fontFamily: v3FontFamily.serifItalic }]}>{t('auth.appName')}</Text>
        <ActivityIndicator color={v3Colors.accentPrimary} style={{ marginTop: 16 }} />
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
