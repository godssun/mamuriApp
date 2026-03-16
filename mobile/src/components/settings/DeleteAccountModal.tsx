import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { accountApi, ApiError } from '../../api/client';

const DELETION_REASONS = [
  '사용 빈도가 낮아서',
  '다른 일기 앱 사용',
  '개인정보 걱정',
  'AI 응답 불만족',
  '앱 사용 불편',
  '기타',
] as const;

interface Props {
  visible: boolean;
  onClose: () => void;
  onDeleted: () => void;
  isPremium: boolean;
}

export default function DeleteAccountModal({ visible, onClose, onDeleted, isPremium }: Props) {
  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reasonDetail, setReasonDetail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetState = () => {
    setStep(1);
    setSelectedReason(null);
    setReasonDetail('');
    setPassword('');
    setError(null);
    setIsDeleting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleNext = () => {
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    } else {
      handleClose();
    }
  };

  const handleDelete = async () => {
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await accountApi.deleteAccount({
        password: password.trim(),
        reason: selectedReason ?? '기타',
        reasonDetail: selectedReason === '기타' ? reasonDetail.trim() || undefined : undefined,
      });
      resetState();
      onDeleted();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('계정 삭제 중 오류가 발생했습니다.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const canProceedStep2 = selectedReason !== null &&
    (selectedReason !== '기타' || reasonDetail.trim().length > 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modal}>
          {/* Step 1: 경고 */}
          {step === 1 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>정말 탈퇴하시겠어요?</Text>

              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>삭제되는 데이터</Text>
                <Text style={styles.warningItem}>- 모든 일기 및 AI 코멘트</Text>
                <Text style={styles.warningItem}>- 대화 기록</Text>
                <Text style={styles.warningItem}>- 컴패니언 설정 및 프로필</Text>
                <Text style={styles.warningItem}>- 스트릭 기록</Text>
              </View>

              <View style={styles.dangerBox}>
                <Text style={styles.dangerText}>
                  이 작업은 되돌릴 수 없습니다. 삭제된 데이터는 복구할 수 없어요.
                </Text>
              </View>

              {isPremium && (
                <View style={styles.premiumWarningBox}>
                  <Text style={styles.premiumWarningText}>
                    현재 구독 중인 플랜이 있습니다. 탈퇴 시 구독이 자동으로 취소됩니다.
                  </Text>
                </View>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>다음</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* Step 2: 사유 선택 */}
          {step === 2 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>탈퇴 사유를 알려주세요</Text>
              <Text style={styles.subtitle}>
                서비스 개선에 활용됩니다.
              </Text>

              <View style={styles.reasonList}>
                {DELETION_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonItem,
                      selectedReason === reason && styles.reasonItemSelected,
                    ]}
                    onPress={() => setSelectedReason(reason)}
                  >
                    <View style={[
                      styles.radioCircle,
                      selectedReason === reason && styles.radioCircleSelected,
                    ]}>
                      {selectedReason === reason && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[
                      styles.reasonText,
                      selectedReason === reason && styles.reasonTextSelected,
                    ]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedReason === '기타' && (
                <TextInput
                  style={styles.detailInput}
                  value={reasonDetail}
                  onChangeText={setReasonDetail}
                  placeholder="구체적인 사유를 입력해주세요"
                  placeholderTextColor="#999"
                  multiline
                  maxLength={500}
                />
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
                  <Text style={styles.cancelButtonText}>이전</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextButton, !canProceedStep2 && styles.buttonDisabled]}
                  onPress={handleNext}
                  disabled={!canProceedStep2}
                >
                  <Text style={styles.nextButtonText}>다음</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* Step 3: 비밀번호 확인 */}
          {step === 3 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>비밀번호 확인</Text>
              <Text style={styles.subtitle}>
                본인 확인을 위해 비밀번호를 입력해주세요.
              </Text>

              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                placeholder="비밀번호"
                placeholderTextColor="#999"
                secureTextEntry
                autoFocus
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
                  <Text style={styles.cancelButtonText}>이전</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.deleteButtonText}>계정 삭제</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  warningBox: {
    backgroundColor: '#FFF9F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  warningItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  dangerBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  dangerText: {
    fontSize: 13,
    color: '#E53E3E',
    lineHeight: 20,
    textAlign: 'center',
  },
  premiumWarningBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  premiumWarningText: {
    fontSize: 13,
    color: '#F59E0B',
    lineHeight: 20,
    textAlign: 'center',
  },
  reasonList: {
    gap: 8,
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 12,
  },
  reasonItemSelected: {
    borderColor: '#FF9B7A',
    backgroundColor: '#FFF9F5',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#FF9B7A',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF9B7A',
  },
  reasonText: {
    fontSize: 15,
    color: '#2D2D2D',
    flex: 1,
  },
  reasonTextSelected: {
    fontWeight: '500',
    color: '#2D2D2D',
  },
  detailInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2D2D2D',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  passwordInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D2D2D',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#E53E3E',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#FF9B7A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
