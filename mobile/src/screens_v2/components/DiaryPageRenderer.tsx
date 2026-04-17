/**
 * DiaryPageRenderer -- shared renderer for editor and detail views
 *
 * editable=true: TextInput + draggable/resizable objects
 * editable=false: Text (read-only) + static objects
 *
 * Both views use identical layout constants so saved content
 * renders the same way in the detail screen.
 */

import React from 'react';
import {
  View, Text, TextInput, StyleSheet, Image,
} from 'react-native';
import { CanvasObject } from './CanvasObject';
import type { CanvasObjectData } from './CanvasObject';

/* ── Shared layout constants ── */
export const CANVAS_PADDING_H = 24;
export const LINE_HEIGHT = 28;

/* ── Props ── */
export interface DiaryPageRendererProps {
  // Content
  title: string;
  content: string;
  theme: string;

  // Objects (photos + stickers)
  objects: CanvasObjectData[];

  // Mode
  editable: boolean;

  // Edit callbacks (editable=true only)
  onTitleChange?: (text: string) => void;
  onContentChange?: (text: string) => void;
  onObjectMove?: (id: string, x: number, y: number) => void;
  onObjectResize?: (id: string, w: number, h: number) => void;
  onObjectDelete?: (id: string) => void;
  onObjectRotate?: (id: string, deg: number) => void;
  onObjectBringForward?: (id: string) => void;
  onObjectSendBackward?: (id: string) => void;
  onObjectSelect?: (id: string | null) => void;
  selectedObjectId?: string | null;

  // Canvas measurement
  onCanvasMeasure?: (width: number, height: number) => void;

  // Styling overrides
  textColor?: string;
  subtleColor?: string;
  borderColor?: string;
  bgColor?: string;

  // Font override (diary font from settings)
  contentFontFamily?: string;

  // Editor-specific
  autoFocus?: boolean;
  textInputRef?: React.RefObject<TextInput | null>;
}

/* ── Notebook Background ── */
/**
 * NotebookBackground — 테마의 pattern 필드에 따라 배경 패턴 렌더링
 *
 * DIARY_THEMES 구조를 기반으로 pattern을 resolve해서 사용.
 * 레거시 키(nature)도 LEGACY_THEME_MAP으로 호환.
 */
function resolvePattern(theme: string): 'none' | 'lined' | 'grid' {
  const { DIARY_THEMES, LEGACY_THEME_MAP } = require('../../constants/stickers');
  const resolved = LEGACY_THEME_MAP[theme] || theme;
  const found = DIARY_THEMES.find((t: any) => t.key === resolved);
  return found?.pattern || 'none';
}

function NotebookBackground({ theme, height, topOffset }: { theme: string; height: number; topOffset: number }) {
  const pattern = resolvePattern(theme);

  // ── 프리미엄 종이 질감 — PaperBackground가 전체 배경을 담당하므로
  //    본문 영역에서는 추가 텍스처 없이 테마 패턴(lined 등)만 렌더링.
  //    crumpled은 lined 패턴을 사용하므로 아래 lined 분기에서 처리됨.
  //    aged/misty는 패턴 없이 배경색+텍스처만으로 무드를 표현.

  if (pattern === 'lined') {
    const lineCount = Math.ceil((height + topOffset) / LINE_HEIGHT) + 1;
    const lineColor = theme === 'warm'
      ? 'rgba(180, 160, 140, 0.12)'
      : 'rgba(160, 148, 135, 0.10)';
    return (
      <View style={[StyleSheet.absoluteFill, { top: -topOffset }]} pointerEvents="none">
        {Array.from({ length: lineCount }).map((_, i) => (
          <View
            key={i}
            style={{
              height: LINE_HEIGHT,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: lineColor,
            }}
          />
        ))}
      </View>
    );
  }
  if (pattern === 'grid') {
    const rowCount = Math.ceil((height + topOffset) / LINE_HEIGHT) + 1;
    return (
      <View style={[StyleSheet.absoluteFill, { top: -topOffset, flexDirection: 'column' }]} pointerEvents="none">
        {Array.from({ length: rowCount }).map((_, row) => (
          <View key={row} style={{ flexDirection: 'row', height: LINE_HEIGHT }}>
            {Array.from({ length: 12 }).map((_, col) => (
              <View
                key={col}
                style={{
                  flex: 1,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: 'rgba(160, 175, 160, 0.10)',
                }}
              />
            ))}
          </View>
        ))}
      </View>
    );
  }
  return null;
}

/* ── Layout alignment constants ──
 *
 * 줄노트 정렬 핵심:
 * - TITLE_AREA_HEIGHT가 LINE_HEIGHT의 배수여야 본문이 줄에 맞음
 * - 제목: LINE_HEIGHT × 2 = 56px (lineHeight 28 + padding으로 2줄 차지)
 * - 구분선: 별도 공간 차지 없음 (제목 영역 안에 포함)
 * - 본문: LINE_HEIGHT 단위로 정확히 정렬
 */
const TITLE_AREA_HEIGHT = LINE_HEIGHT * 2; // 56px — 제목이 정확히 2줄 차지

/* ── Renderer ── */
const noop = () => {};

export function DiaryPageRenderer({
  title,
  content,
  theme,
  objects,
  editable,
  onTitleChange,
  onContentChange,
  onObjectMove,
  onObjectResize,
  onObjectDelete,
  onObjectRotate,
  onObjectBringForward,
  onObjectSendBackward,
  onObjectSelect,
  selectedObjectId,
  onCanvasMeasure,
  textColor = '#1A1A2E',
  subtleColor = '#999',
  borderColor = '#E0E0E0',
  bgColor,
  contentFontFamily,
  autoFocus,
  textInputRef,
}: DiaryPageRendererProps) {
  const [canvasHeight, setCanvasHeight] = React.useState(400);

  const handleLayout = React.useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasHeight(height);
    onCanvasMeasure?.(width, height);
  }, [onCanvasMeasure]);

  const sortedObjects = [...objects].sort((a, b) => a.zIndex - b.zIndex);

  // Calculate minimum height to contain all objects
  const objectsMaxBottom = objects.reduce((max, obj) => {
    const bottom = obj.y + obj.height + (obj.rotation ? obj.height * 0.2 : 0);
    return Math.max(max, bottom);
  }, 0);
  const dynamicMinHeight = Math.max(400, objectsMaxBottom + LINE_HEIGHT);

  // 본문 폰트 오버라이드
  const contentFont = contentFontFamily
    ? { fontFamily: contentFontFamily }
    : undefined;

  return (
    <View
      style={[styles.pageContainer, { minHeight: dynamicMinHeight }, bgColor ? { backgroundColor: bgColor } : undefined]}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => {
        if (editable && selectedObjectId) {
          onObjectSelect?.(null);
        }
        return false;
      }}
    >
      {/* Layer 0: Background pattern — 줄이 paddingTop 포함 전체에 깔림 */}
      <NotebookBackground theme={theme} height={canvasHeight} topOffset={0} />

      {/* Layer 1: Text */}
      <View style={styles.textLayer} pointerEvents="box-none">
        {/* 제목 영역: 정확히 TITLE_AREA_HEIGHT(LINE_HEIGHT×2) 차지 */}
        <View style={styles.titleArea}>
          {editable ? (
            <TextInput
              style={[styles.titleStyle, { color: textColor }, contentFont && { fontFamily: contentFontFamily }]}
              placeholder="제목 (선택)"
              placeholderTextColor={subtleColor}
              value={title}
              onChangeText={onTitleChange}
              maxLength={100}
            />
          ) : (
            title ? (
              <Text style={[styles.titleStyle, { color: textColor }, contentFont && { fontFamily: contentFontFamily }]}>{title}</Text>
            ) : null
          )}
          <View style={[styles.divider, { backgroundColor: borderColor }]} />
        </View>

        {/* 본문 영역: 줄 배경 그리드에 정확히 정렬 */}
        {editable ? (
          <TextInput
            ref={textInputRef}
            style={[styles.contentStyle, { color: textColor }, contentFont]}
            placeholder="오늘 어떤 하루였나요?"
            placeholderTextColor={subtleColor}
            value={content}
            onChangeText={onContentChange}
            multiline
            scrollEnabled={false}
            autoFocus={autoFocus}
          />
        ) : (
          <Text style={[styles.contentStyle, { color: textColor }, contentFont]}>{content}</Text>
        )}
      </View>

      {/* Layer 2+: Objects (photos/stickers, absolute positioned) */}
      {sortedObjects.map(obj => (
        <CanvasObject
          key={obj.id}
          data={obj}
          editable={editable}
          selected={selectedObjectId === obj.id}
          onSelect={editable ? (id) => onObjectSelect?.(id) : noop}
          onMove={editable ? (id, x, y) => onObjectMove?.(id, x, y) : noop}
          onResize={editable ? (id, w, h) => onObjectResize?.(id, w, h) : noop}
          onRotate={editable ? (id, deg) => onObjectRotate?.(id, deg) : noop}
          onDelete={editable ? (id) => onObjectDelete?.(id) : noop}
          onBringForward={editable ? (id) => onObjectBringForward?.(id) : undefined}
          onSendBackward={editable ? (id) => onObjectSendBackward?.(id) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    position: 'relative',
    minHeight: 400,
    paddingHorizontal: CANVAS_PADDING_H,
    /**
     * paddingTop = LINE_HEIGHT (28px)
     * 줄 배경의 첫 번째 줄과 제목 텍스트가 정렬되도록
     */
    paddingTop: LINE_HEIGHT,
    overflow: 'visible',
  },
  textLayer: {
    zIndex: 100,
  },
  /**
   * 제목 영역: 정확히 LINE_HEIGHT × 2 = 56px
   * 제목 텍스트 + 구분선이 이 안에 포함
   * → 본문이 3번째 줄부터 시작하여 줄 배경에 정확히 맞음
   */
  titleArea: {
    height: TITLE_AREA_HEIGHT,
    justifyContent: 'center',
  },
  titleStyle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: LINE_HEIGHT,
    paddingTop: 0,
    paddingBottom: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginTop: 6,
  },
  /**
   * 본문: lineHeight가 LINE_HEIGHT(28px)와 정확히 일치
   * paddingTop: 0으로 줄 배경 그리드에 바로 맞춤
   */
  contentStyle: {
    fontSize: 15,
    lineHeight: LINE_HEIGHT,
    paddingTop: 0,
    paddingBottom: 0,
    minHeight: 200,
    textAlignVertical: 'top',
  },
});
