import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface Props {
  onSend: (content: string) => void;
  isSending: boolean;
  disabled: boolean;
  placeholder?: string;
}

const MAX_LENGTH = 500;

export default function MessageInput({
  onSend,
  isSending,
  disabled,
  placeholder = '답장을 입력하세요...',
}: Props) {
  const [text, setText] = useState('');

  const canSend = text.trim().length > 0 && !isSending && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    const content = text.trim();
    setText('');
    onSend(content);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={text}
          onChangeText={setText}
          placeholder={disabled ? '답변 횟수를 모두 사용했어요' : placeholder}
          placeholderTextColor="#BBB"
          multiline
          maxLength={MAX_LENGTH}
          editable={!disabled && !isSending}
        />
        <TouchableOpacity
          style={[styles.sendButton, canSend && styles.sendButtonActive]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.sendText, canSend && styles.sendTextActive]}>
              전송
            </Text>
          )}
        </TouchableOpacity>
      </View>
      {text.length > 0 && (
        <Text style={styles.charCount}>
          {text.length}/{MAX_LENGTH}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#2D2D2D',
    maxHeight: 100,
  },
  inputDisabled: {
    backgroundColor: '#F0F0F0',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#FF9B7A',
  },
  sendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  sendTextActive: {
    color: '#fff',
  },
  charCount: {
    fontSize: 11,
    color: '#BBB',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 56,
  },
});
