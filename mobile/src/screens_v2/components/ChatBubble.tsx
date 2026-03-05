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
  ViewStyle,
} from 'react-native';
import { useThemeV2 } from '../../design-system-v2';

type BubbleSender = 'ai' | 'user';

interface ChatBubbleProps {
  message: string;
  sender: BubbleSender;
  timestamp?: string;
  isTyping?: boolean;
  animated?: boolean;
}

export function ChatBubble({
  message,
  sender,
  timestamp,
  isTyping = false,
  animated = true,
}: ChatBubbleProps) {
  const { theme } = useThemeV2();
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
          <Text style={styles.avatarEmoji}>🌱</Text>
        </View>
      )}

      <View style={bubbleStyle}>
        {isTyping ? (
          <TypingDots theme={theme} />
        ) : (
          <Text style={[theme.typography.bodyMedium, { color: textColor }]}>
            {message}
          </Text>
        )}
      </View>

      {timestamp && (
        <Text style={[
          theme.typography.caption,
          {
            color: theme.colors.textTertiary,
            marginTop: theme.spacing.xxs,
            paddingHorizontal: theme.spacing.xs,
          },
        ]}>
          {timestamp}
        </Text>
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
