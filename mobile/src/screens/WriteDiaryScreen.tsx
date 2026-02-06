import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { diaryApi, ApiError } from '../api/client';
import { DiaryStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<DiaryStackParamList, 'WriteDiary'>;
};

export default function WriteDiaryScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getTodayTitle = () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    return `${month}월 ${day}일의 일기`;
  };

  const handleSave = async () => {
    const finalTitle = title.trim() || getTodayTitle();

    if (!content.trim()) {
      Alert.alert('알림', '일기 내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const diary = await diaryApi.create({
        title: finalTitle,
        content: content.trim(),
      });

      // 성공 시 상세 화면으로 이동
      navigation.replace('DiaryDetail', { diaryId: diary.id });
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : '일기 저장 중 오류가 발생했습니다.';
      Alert.alert('저장 실패', message);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        '작성 취소',
        '작성 중인 내용이 사라집니다. 정말 취소하시겠어요?',
        [
          { text: '계속 작성', style: 'cancel' },
          { text: '취소', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일기 쓰기</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FF9B7A" />
          ) : (
            <Text style={styles.saveButton}>완료</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.titleInput}
          placeholder={getTodayTitle()}
          placeholderTextColor="#CCC"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <TextInput
          style={styles.contentInput}
          placeholder="오늘 하루는 어떠셨나요?&#10;당신의 이야기를 들려주세요."
          placeholderTextColor="#CCC"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          AI가 당신의 일기를 읽고 따뜻한 코멘트를 남겨드릴게요
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  cancelButton: {
    fontSize: 16,
    color: '#999',
  },
  saveButton: {
    fontSize: 16,
    color: '#FF9B7A',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contentInput: {
    fontSize: 16,
    color: '#2D2D2D',
    lineHeight: 26,
    minHeight: 200,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerText: {
    fontSize: 13,
    color: '#999',
  },
});
