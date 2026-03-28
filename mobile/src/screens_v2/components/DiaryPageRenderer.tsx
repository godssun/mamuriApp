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

  // Editor-specific
  autoFocus?: boolean;
  textInputRef?: React.RefObject<TextInput | null>;
}

/* ── Notebook Background ── */
function NotebookBackground({ theme, height }: { theme: string; height: number }) {
  if (theme === 'note' || theme === 'warm') {
    const lineCount = Math.ceil(height / LINE_HEIGHT);
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: lineCount }).map((_, i) => (
          <View
            key={i}
            style={{
              height: LINE_HEIGHT,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme === 'note' ? '#E8E0D0' : '#F0E8E0',
            }}
          />
        ))}
      </View>
    );
  }
  if (theme === 'grid' || theme === 'nature') {
    const rowCount = Math.ceil(height / LINE_HEIGHT);
    return (
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'column' }]} pointerEvents="none">
        {Array.from({ length: rowCount }).map((_, row) => (
          <View key={row} style={{ flexDirection: 'row', height: LINE_HEIGHT }}>
            {Array.from({ length: 12 }).map((_, col) => (
              <View
                key={col}
                style={{
                  flex: 1,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme === 'grid' ? '#D0D8D0' : '#D8E8D8',
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

  return (
    <View
      style={[styles.pageContainer, bgColor ? { backgroundColor: bgColor } : undefined]}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => {
        if (editable && selectedObjectId) {
          onObjectSelect?.(null);
        }
        return false; // don't claim the responder — let children handle their own touches
      }}
    >
      {/* Layer 0: Background pattern */}
      <NotebookBackground theme={theme} height={canvasHeight} />

      {/* Layer 1: Text — box-none lets touches pass through empty areas to objects below */}
      <View style={styles.textLayer} pointerEvents="box-none">
        {editable ? (
          <>
            <TextInput
              style={[styles.titleStyle, { color: textColor }]}
              placeholder="제목 (선택)"
              placeholderTextColor={subtleColor}
              value={title}
              onChangeText={onTitleChange}
              maxLength={100}
            />
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            <TextInput
              ref={textInputRef}
              style={[styles.contentStyle, { color: textColor }]}
              placeholder="오늘 어떤 하루였나요?"
              placeholderTextColor={subtleColor}
              value={content}
              onChangeText={onContentChange}
              multiline
              scrollEnabled={false}
              autoFocus={autoFocus}
            />
          </>
        ) : (
          <>
            {title ? (
              <Text style={[styles.titleStyle, { color: textColor }]}>{title}</Text>
            ) : null}
            {title ? (
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
            ) : null}
            <Text style={[styles.contentStyle, { color: textColor }]}>{content}</Text>
          </>
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
    paddingTop: 16,
    overflow: 'visible',
  },
  textLayer: {
    zIndex: 100,
  },
  titleStyle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 32,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  contentStyle: {
    fontSize: 15,
    lineHeight: LINE_HEIGHT,
    paddingTop: 0,
    minHeight: 200,
    textAlignVertical: 'top',
  },
});
