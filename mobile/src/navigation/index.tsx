import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  DiaryStackParamList,
} from '../types';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DiaryListScreen from '../screens/DiaryListScreen';
import WriteDiaryScreen from '../screens/WriteDiaryScreen';
import DiaryDetailScreen from '../screens/DiaryDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const DiaryStack = createNativeStackNavigator<DiaryStackParamList>();

// 탭 아이콘 컴포넌트
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    '일기': '📝',
    '설정': '⚙️',
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text style={styles.tabIcon}>{icons[label]}</Text>
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

// 메인 탭
function MainNavigator() {
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
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <TabIcon label="설정" focused={focused} />,
        }}
      />
    </MainTab.Navigator>
  );
}

// 루트 네비게이션
export default function Navigation() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
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
  tabLabel: {
    fontSize: 11,
    color: '#999',
  },
  tabLabelFocused: {
    color: '#FF9B7A',
    fontWeight: '500',
  },
});
