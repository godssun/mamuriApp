/**
 * V2 Design Preview Navigator
 *
 * Standalone navigator for previewing all v2 screens.
 * Toggle PREVIEW_V2 = true in App.tsx to activate.
 *
 * NOTE: Now that v2 screens use typed navigation props,
 * this preview navigator uses `as any` casts.
 * For production, use the main navigation in src/navigation/index.tsx.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProviderV2 } from '../design-system-v2';

import { LoginScreenV2 } from './LoginScreenV2';
import { SignupScreenV2 } from './SignupScreenV2';
import { DiaryListScreenV2 } from './DiaryListScreenV2';
import { DiaryWriteScreenV2 } from './DiaryWriteScreenV2';
import { DiaryDetailScreenV2 } from './DiaryDetailScreenV2';
import { AICommentScreenV2 } from './AICommentScreenV2';
import { PreviewHomeScreen } from './PreviewHomeScreen';

export type PreviewStackParamList = {
  PreviewHome: undefined;
  LoginV2: undefined;
  SignupV2: undefined;
  DiaryListV2: undefined;
  DiaryWriteV2: undefined;
  DiaryDetailV2: { diaryId: number };
  AICommentV2: { diaryId: number };
};

const Stack = createNativeStackNavigator<PreviewStackParamList>();

export function PreviewNavigator() {
  return (
    <SafeAreaProvider>
      <ThemeProviderV2>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PreviewHome" component={PreviewHomeScreen} />
            <Stack.Screen name="LoginV2" component={LoginScreenV2 as any} />
            <Stack.Screen name="SignupV2" component={SignupScreenV2 as any} />
            <Stack.Screen name="DiaryListV2" component={DiaryListScreenV2 as any} />
            <Stack.Screen name="DiaryWriteV2" component={DiaryWriteScreenV2 as any} />
            <Stack.Screen name="DiaryDetailV2" component={DiaryDetailScreenV2 as any} />
            <Stack.Screen name="AICommentV2" component={AICommentScreenV2 as any} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProviderV2>
    </SafeAreaProvider>
  );
}
