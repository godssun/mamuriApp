/**
 * ChatBubble v3 — Warm paper-tone conversation bubble
 *
 * AI bubbles: ivory paper card with sage accent, script-like warmth
 * User bubbles: soft sage solid with white text
 *
 * "조용히 곁에 있는 AI 친구와 주고받는 메모 조각" 느낌.
 * v3 design system tokens. No react-native-svg.
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  colors, fontFamily, shadows, spacing, borderRadius, duration,
} from '../../design-system-v3';

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
  message, sender, timestamp, isTyping = false,
  animated = true, messageId, onReport,
}: ChatBubbleProps) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animated ? 12 : 0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: duration.normal, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: duration.normal, useNativeDriver: true }),
      ]).start();
    }
  }, [animated]);

  const isAI = sender === 'ai';

  return (
    <Animated.View style={[
      styles.wrapper,
      {
        alignItems: isAI ? 'flex-start' : 'flex-end',
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      },
    ]}>
      {/* AI companion indicator */}
      {isAI && (
        <View style={styles.aiIndicator}>
          <View style={styles.aiDot} />
          <Text style={styles.aiName}>마무리</Text>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={isAI && onReport && messageId ? () => onReport(messageId) : undefined}
        delayLongPress={500}
        style={isAI ? styles.aiBubble : styles.userBubble}
      >
        {isTyping ? (
          <TypingDots />
        ) : (
          <Text style={isAI ? styles.aiText : styles.userText}>
            {message}
          </Text>
        )}
      </TouchableOpacity>

      {/* Timestamp + report */}
      {timestamp && (
        <View style={styles.timestampRow}>
          <Text style={styles.timestamp}>{timestamp}</Text>
          {isAI && onReport && messageId && (
            <TouchableOpacity
              onPress={() => onReport(messageId)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.reportText}>{t('report.action')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Animated.View>
  );
}

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ]));

    const anims = [animateDot(dot1, 0), animateDot(dot2, 150), animateDot(dot3, 300)];
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.typingContainer}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 4,
    marginBottom: spacing.md,
  },

  // AI indicator — small name label
  aiIndicator: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.xs, marginBottom: spacing.xs,
    paddingLeft: 2,
  },
  aiDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.accentPrimary,
  },
  aiName: {
    fontFamily: fontFamily.sans,
    fontSize: 11, color: colors.accentPrimary,
    letterSpacing: 0.2,
  },

  // AI bubble — warm paper card
  aiBubble: {
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.lg,
    borderTopLeftRadius: borderRadius.xs,
    padding: spacing.lg,
    maxWidth: '82%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadows.crisp,
  },
  aiText: {
    fontFamily: fontFamily.sans,
    fontSize: 15, lineHeight: 24,
    color: colors.textPrimary,
  },

  // User bubble — soft sage
  userBubble: {
    backgroundColor: colors.accentPrimary,
    borderRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.xs,
    padding: spacing.lg,
    maxWidth: '82%',
  },
  userText: {
    fontFamily: fontFamily.sans,
    fontSize: 15, lineHeight: 24,
    color: colors.surfacePure,
  },

  // Timestamp
  timestampRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginTop: 3,
  },
  timestamp: {
    fontFamily: fontFamily.sans,
    fontSize: 10, color: colors.textTertiary,
    paddingHorizontal: spacing.xs,
  },
  reportText: {
    fontFamily: fontFamily.sans,
    fontSize: 10, color: colors.textTertiary,
  },

  // Typing dots
  typingContainer: {
    flexDirection: 'row', alignItems: 'center',
    height: 20, paddingHorizontal: 4, gap: 6,
  },
  typingDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.accentPrimary,
  },
});
