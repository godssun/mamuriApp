import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { settingsApi, ApiError } from '../api/client';
import { UserSettings } from '../types';

const AI_TONE_OPTIONS = [
  { value: 'warm' as const, label: '따뜻한', description: '공감하고 위로하는 톤' },
  { value: 'calm' as const, label: '차분한', description: '안정적이고 담담한 톤' },
  { value: 'cheerful' as const, label: '밝은', description: '긍정적이고 활기찬 톤' },
];

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!settings) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    setIsSaving(true);

    try {
      await settingsApi.update(newSettings);
    } catch (error) {
      // 롤백
      setSettings(settings);
      const message = error instanceof ApiError
        ? error.message
        : '설정 저장에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9B7A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>설정</Text>
      </View>

      <View style={styles.content}>
        {/* AI 설정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 코멘트</Text>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>AI 코멘트 받기</Text>
              <Text style={styles.settingDescription}>
                일기 작성 시 AI 코멘트를 받습니다
              </Text>
            </View>
            <Switch
              value={settings?.aiEnabled ?? true}
              onValueChange={(value) => updateSettings({ aiEnabled: value })}
              trackColor={{ false: '#E5E5E5', true: '#FFD0C2' }}
              thumbColor={settings?.aiEnabled ? '#FF9B7A' : '#fff'}
            />
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.settingLabel}>AI 톤</Text>
            <View style={styles.toneOptions}>
              {AI_TONE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.toneOption,
                    settings?.aiTone === option.value && styles.toneOptionSelected,
                  ]}
                  onPress={() => updateSettings({ aiTone: option.value })}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.toneLabel,
                      settings?.aiTone === option.value && styles.toneLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.toneDescription,
                      settings?.aiTone === option.value && styles.toneDescriptionSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 계정 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>

        {/* 앱 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <Text style={styles.versionText}>마무리 v1.0.0</Text>
          <Text style={styles.disclaimerText}>
            AI 코멘트는 외부 LLM API를 통해 생성됩니다.{'\n'}
            전문적인 상담이 필요한 경우 전문가의 도움을 받으세요.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
  },
  toneOptions: {
    marginTop: 12,
    gap: 8,
  },
  toneOption: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
  },
  toneOptionSelected: {
    borderColor: '#FF9B7A',
    backgroundColor: '#FFF0EB',
  },
  toneLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  toneLabelSelected: {
    color: '#FF9B7A',
  },
  toneDescription: {
    fontSize: 13,
    color: '#999',
  },
  toneDescriptionSelected: {
    color: '#FF9B7A',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#BBB',
    lineHeight: 20,
  },
});
