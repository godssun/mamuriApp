/**
 * Design System v2 — Chat Bubble Component
 *
 * For AI conversation / diary comment display.
 * Variants: ai, user
 * Features: typing indicator, timestamp, subtle entrance animation
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeV2 } from '../../design-system-v2';

type BubbleSender = 'ai' | 'user';

interface ChatBubbleProps {
  message: string;
  sender: BubbleSender;
  timestamp?: string;
  isTyping?: boolean;
  animated?: boolean;
  messageId?: number;
  onReport?: (messageId: number) => void;
}

export function ChatBubble({
  message,
  sender,
  timestamp,
  isTyping = false,
  animated = true,
  messageId,
  onReport,
}: ChatBubbleProps) {
  const { theme } = useThemeV2();
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animated ? 12 : 0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: theme.duration.smooth,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: theme.duration.smooth,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, fadeAnim, slideAnim, theme]);

  const isAI = sender === 'ai';

  const bubbleStyle: ViewStyle = {
    backgroundColor: isAI ? theme.colors.aiBubbleBg : theme.colors.userBubbleBg,
    borderRadius: theme.borderRadius.xl,
    ...(isAI
      ? { borderTopLeftRadius: theme.borderRadius.xs }
      : { borderTopRightRadius: theme.borderRadius.xs }),
    padding: theme.spacing.lg,
    maxWidth: '80%',
    ...(isAI ? {} : theme.shadows.sm),
  };

  const textColor = isAI ? theme.colors.aiBubbleText : theme.colors.userBubbleText;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          alignItems: isAI ? 'flex-start' : 'flex-end',
          marginBottom: theme.spacing.sm,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* AI avatar indicator */}
      {isAI && (
        <View style={[
          styles.avatarDot,
          {
            backgroundColor: theme.colors.primary,
            marginBottom: theme.spacing.xs,
          },
        ]}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#6356D9' }} />
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={isAI && onReport && messageId ? () => onReport(messageId) : undefined}
        delayLongPress={500}
        style={bubbleStyle}
      >
        {isTyping ? (
          <TypingDots theme={theme} />
        ) : (
          <Text style={[theme.typography.bodyMedium, { color: textColor }]}>
            {message}
          </Text>
        )}
      </TouchableOpacity>

      {/* Timestamp + report hint */}
      {timestamp && (
        <View style={styles.timestampRow}>
          <Text style={[
            theme.typography.caption,
            {
              color: theme.colors.textTertiary,
              paddingHorizontal: theme.spacing.xs,
            },
          ]}>
            {timestamp}
          </Text>
          {isAI && onReport && messageId && (
            <TouchableOpacity
              onPress={() => onReport(messageId)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[
                theme.typography.caption,
                { color: theme.colors.textDisabled },
              ]}>
                {t('report.action')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
}

/** Animated typing dots */
function TypingDots({ theme }: { theme: any }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const anim1 = animateDot(dot1, 0);
    const anim2 = animateDot(dot2, 150);
    const anim3 = animateDot(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingContainer}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.typingDot,
            {
              backgroundColor: theme.colors.primary,
              opacity: dot,
              marginHorizontal: 3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 4,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  avatarDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarEmoji: {
    fontSize: 14,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
