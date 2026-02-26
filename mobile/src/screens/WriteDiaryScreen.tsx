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
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation as useRootNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp as RootNav } from '@react-navigation/native-stack';
import { diaryApi, companionApi, ApiError } from '../api/client';
import { DiaryStackParamList, MainStackParamList, LevelUpInfo } from '../types';
import { LevelUpModal } from '../components/companion';
import { useSubscription } from '../contexts/SubscriptionContext';
import CrisisBanner from '../components/CrisisBanner';

type Props = {
  navigation: NativeStackNavigationProp<DiaryStackParamList, 'WriteDiary'>;
};

const formatDateKorean = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
};

const formatDateISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function WriteDiaryScreen({ navigation }: Props) {
  const rootNavigation = useRootNavigation<RootNav<MainStackParamList>>();
  const { info, isPremium, quotaRemaining, hasCrisisFlag, refresh: refreshSubscription } = useSubscription();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [diaryDate, setDiaryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUpInfo | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [aiName, setAiName] = useState('마음이');
  const [savedDiaryId, setSavedDiaryId] = useState<number | null>(null);

  React.useEffect(() => {
    companionApi.getProfile()
      .then((profile) => setAiName(profile.aiName))
      .catch(() => {});
  }, []);

  const getDefaultTitle = () => {
    const month = diaryDate.getMonth() + 1;
    const day = diaryDate.getDate();
    return `${month}월 ${day}일의 일기`;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDiaryDate(selectedDate);
    }
  };

  const handleDateConfirm = () => {
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    const finalTitle = title.trim() || getDefaultTitle();

    if (!content.trim()) {
      Alert.alert('알림', '일기 내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const diary = await diaryApi.create({
        title: finalTitle,
        content: content.trim(),
        diaryDate: formatDateISO(diaryDate),
      });

      // AI 성공 후 구독 상태 갱신 (쿼터 반영)
      refreshSubscription();

      if (diary.levelUp) {
        setSavedDiaryId(diary.id);
        setLevelUpInfo(diary.levelUp);
        setShowLevelUp(true);
      } else {
        navigation.replace('DiaryDetail', { diaryId: diary.id });
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        // 쿼터 초과 → 페이월로 이동
        rootNavigation.navigate('Paywall');
        return;
      }
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

  const handleLevelUpClose = () => {
    setShowLevelUp(false);
    if (savedDiaryId) {
      navigation.replace('DiaryDetail', { diaryId: savedDiaryId });
    }
  };

  const isToday = formatDateISO(diaryDate) === formatDateISO(new Date());

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>취소</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>일기 쓰기</Text>
          {!isPremium && quotaRemaining !== Infinity && (
            <Text style={[
              styles.quotaCounter,
              quotaRemaining <= 5 && styles.quotaCounterWarn,
            ]}>
              AI 코멘트 {(info?.quotaUsed ?? 0)}/{(info?.quotaLimit ?? 20)}
            </Text>
          )}
        </View>
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

      {hasCrisisFlag && <CrisisBanner />}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 날짜 선택 */}
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{formatDateKorean(diaryDate)}</Text>
          {isToday && <Text style={styles.todayBadge}>오늘</Text>}
          <Text style={styles.dateChevron}>›</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.titleInput}
          placeholder={getDefaultTitle()}
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

      {/* iOS용 모달 DatePicker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerCancel}>취소</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>날짜 선택</Text>
                <TouchableOpacity onPress={handleDateConfirm}>
                  <Text style={styles.datePickerConfirm}>확인</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={diaryDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                locale="ko-KR"
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android용 DatePicker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={diaryDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
      {levelUpInfo && (
        <LevelUpModal
          visible={showLevelUp}
          levelUpInfo={levelUpInfo}
          aiName={aiName}
          onClose={handleLevelUpClose}
        />
      )}
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  quotaCounter: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  quotaCounterWarn: {
    color: '#FF9B7A',
    fontWeight: '600',
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
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dateIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: '#2D2D2D',
    fontWeight: '500',
  },
  todayBadge: {
    fontSize: 12,
    color: '#FF9B7A',
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
  },
  dateChevron: {
    fontSize: 20,
    color: '#CCC',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#999',
  },
  datePickerConfirm: {
    fontSize: 16,
    color: '#FF9B7A',
    fontWeight: '600',
  },
  datePicker: {
    height: 200,
  },
});
