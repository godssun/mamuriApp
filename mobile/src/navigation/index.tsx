import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { companionApi } from '../api/client';
import {
  RootStackParamList,
  AuthStackParamList,
  MainStackParamList,
  MainTabParamList,
  DiaryStackParamList,
} from '../types';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DiaryListScreen from '../screens/DiaryListScreen';
import WriteDiaryScreen from '../screens/WriteDiaryScreen';
import DiaryDetailScreen from '../screens/DiaryDetailScreen';
import CompanionScreen from '../screens/CompanionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaywallScreen from '../screens/PaywallScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import CompanionSetupScreen from '../screens/CompanionSetupScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const DiaryStack = createNativeStackNavigator<DiaryStackParamList>();

// 탭 아이콘 컴포넌트
function TabIcon({ label, icon, focused }: { label: string; icon?: string; focused: boolean }) {
  return (
    <View style={styles.tabIconContainer}>
      {icon ? (
        <Text style={styles.tabIcon}>{icon}</Text>
      ) : (
        <View style={[styles.tabDot, focused && styles.tabDotFocused]} />
      )}
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
}

// 인증 스택
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

// 일기 스택
function DiaryNavigator() {
  return (
    <DiaryStack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <DiaryStack.Screen name="DiaryListHome" component={DiaryListScreen} />
      <DiaryStack.Screen name="WriteDiary" component={WriteDiaryScreen} />
      <DiaryStack.Screen name="DiaryDetail" component={DiaryDetailScreen} />
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
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FF9B7A',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <MainTab.Screen
        name="DiaryList"
        component={DiaryNavigator}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <TabIcon label="일기" focused={focused} />,
        }}
      />
      <MainTab.Screen
        name="Companion"
        component={CompanionScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <TabIcon label={tabLabel} focused={focused} />,
        }}
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
        <MainStack.Screen name="CompanionSetup" component={CompanionSetupScreen} />
      ) : (
        <>
          <MainStack.Screen name="MainTabs" component={MainTabsNavigator} />
          <MainStack.Screen name="Settings" component={SettingsScreen} />
          <MainStack.Screen name="Paywall" component={PaywallScreen} />
          <MainStack.Screen name="Subscription" component={SubscriptionScreen} />
        </>
      )}
    </MainStack.Navigator>
  );
}

// 루트 네비게이션
export default function Navigation() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.loadingText}>마무리</Text>
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
    backgroundColor: '#FFF9F5',
  },
  loadingText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF9B7A',
  },
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor: '#F0F0F0',
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginBottom: 4,
  },
  tabDotFocused: {
    backgroundColor: '#FF9B7A',
  },
  tabLabel: {
    fontSize: 11,
    color: '#999',
  },
  tabLabelFocused: {
    color: '#FF9B7A',
    fontWeight: '500',
  },
});
