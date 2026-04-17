/**
 * ScheduleScreenV3 — "하루의 리듬을 조용히 함께 지켜주는 공간"
 *
 * MVP scope (step 5):
 *  - Monthly grid with a gentle paper-tone background
 *  - Today / selected-day list underneath
 *  - Create / edit / delete via a bottom sheet modal
 *  - Local notification 5 min before start (expo-notifications)
 *  - Manual link to a diary entry (linkedDiaryId)
 *
 * Out of scope (Phase 2): repeats, categories, search, emotion overlay.
 * The visuals stay PaperBackground + serif italic to avoid drifting into
 * a productivity-app feel.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, Switch, Alert, Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';
import {
  colors, fontFamily, shadows, spacing, borderRadius,
} from '../design-system-v3';
import { PaperBackground } from '../design-system-v3/components/PaperBackground';
import { scheduleApi } from '../api/client';
import type { Schedule } from '../types';

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function fmtDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

async function scheduleReminder(s: Schedule, body: string): Promise<string | null> {
  const start = new Date(s.startAt);
  const trigger = new Date(start.getTime() - 5 * 60 * 1000);
  if (trigger.getTime() <= Date.now()) return null;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: s.title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger } as any,
    });
    return id;
  } catch {
    return null;
  }
}

export default function ScheduleScreenV3() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const { t } = useTranslation();

  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [schedulesByDay, setSchedulesByDay] = useState<Record<string, Schedule[]>>({});
  const [selectedDaySchedules, setSelectedDaySchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit / create modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formStart, setFormStart] = useState<Date>(new Date());
  const [formEnd, setFormEnd] = useState<Date | null>(null);
  const [formNote, setFormNote] = useState('');
  const [formAllDay, setFormAllDay] = useState(false);
  const [formLinkedDiaryId, setFormLinkedDiaryId] = useState<number | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const weekdays = WEEKDAY_KEYS.map((k) => t(`schedule.weekday.${k}`));
  const monthLabel = t('schedule.monthLabel', {
    year: cursor.getFullYear(),
    month: cursor.getMonth() + 1,
  });

  const loadMonth = useCallback(async () => {
    try {
      const from = fmtDateKey(startOfMonth(cursor));
      const to = fmtDateKey(endOfMonth(cursor));
      const items = await scheduleApi.list(from, to);
      const map: Record<string, Schedule[]> = {};
      for (const s of items) {
        const key = fmtDateKey(new Date(s.startAt));
        if (!map[key]) map[key] = [];
        map[key].push(s);
      }
      setSchedulesByDay(map);
      const dayKey = fmtDateKey(selectedDate);
      setSelectedDaySchedules(map[dayKey] || []);
    } catch {
      // 조용히 무시 — 빈 상태로 놔둠
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cursor, selectedDate]);

  useFocusEffect(useCallback(() => { loadMonth(); }, [loadMonth]));

  const onRefresh = () => {
    setRefreshing(true);
    loadMonth();
  };

  const changeMonth = (delta: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    setCursor(next);
  };

  const handleSelectDay = (d: Date) => {
    setSelectedDate(d);
    setSelectedDaySchedules(schedulesByDay[fmtDateKey(d)] || []);
  };

  const openCreate = () => {
    const base = new Date(selectedDate);
    base.setHours(new Date().getHours());
    base.setMinutes(0);
    base.setSeconds(0);
    setEditing(null);
    setFormTitle('');
    setFormStart(base);
    setFormEnd(null);
    setFormNote('');
    setFormAllDay(false);
    setFormLinkedDiaryId(null);
    setModalOpen(true);
  };

  const openEdit = (s: Schedule) => {
    setEditing(s);
    setFormTitle(s.title);
    setFormStart(new Date(s.startAt));
    setFormEnd(s.endAt ? new Date(s.endAt) : null);
    setFormNote(s.note || '');
    setFormAllDay(s.isAllDay);
    setFormLinkedDiaryId(s.linkedDiaryId ?? null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleSave = async () => {
    const title = formTitle.trim();
    if (!title) {
      Alert.alert(t('common.alert'), t('schedule.titleRequired'));
      return;
    }
    if (formEnd && formEnd < formStart) {
      Alert.alert(t('common.alert'), t('schedule.invalidRange'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        startAt: formStart.toISOString(),
        endAt: formEnd ? formEnd.toISOString() : null,
        note: formNote.trim() || null,
        isAllDay: formAllDay,
        linkedDiaryId: formLinkedDiaryId,
      };
      const saved = editing
        ? await scheduleApi.update(editing.id, payload)
        : await scheduleApi.create(payload);
      await scheduleReminder(saved, t('schedule.reminderBody'));
      closeModal();
      await loadMonth();
    } catch (error: any) {
      Alert.alert(t('common.alert'), error?.message || t('common.retry'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert(t('schedule.deleteTitle'), t('schedule.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await scheduleApi.delete(editing.id);
            closeModal();
            await loadMonth();
          } catch (error: any) {
            Alert.alert(t('common.alert'), error?.message || t('common.retry'));
          }
        },
      },
    ]);
  };

  const openLinkedDiary = () => {
    if (!editing?.linkedDiaryId) return;
    closeModal();
    nav.navigate('DiaryList', {
      screen: 'DiaryDetail',
      params: { diaryId: editing.linkedDiaryId },
    });
  };

  const openWriteDiaryForSchedule = () => {
    closeModal();
    nav.navigate('DiaryList', { screen: 'WriteDiary', params: {} });
  };

  const monthCells = useMemo(
    () => getMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );
  const today = new Date();
  const isThisMonth = cursor.getFullYear() === today.getFullYear()
    && cursor.getMonth() === today.getMonth();

  return (
    <PaperBackground variant="plain" color="cream">
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('schedule.title')}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPrimary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Month navigation */}
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.monthArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{monthLabel}</Text>
            <TouchableOpacity
              onPress={() => changeMonth(1)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              disabled={isThisMonth}
            >
              <Text style={[styles.monthArrow, isThisMonth && { opacity: 0.25 }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday labels */}
          <View style={styles.weekdayRow}>
            {weekdays.map((w, i) => (
              <Text key={i} style={[
                styles.weekdayLabel,
                i === 0 && { color: colors.accentRose },
              ]}>{w}</Text>
            ))}
          </View>

          {/* Month grid */}
          {loading ? (
            <View style={styles.center}><ActivityIndicator color={colors.accentPrimary} /></View>
          ) : (
            <View style={styles.grid}>
              {monthCells.map((cell, idx) => {
                if (!cell) return <View key={idx} style={styles.cellEmpty} />;
                const dayKey = fmtDateKey(cell);
                const hasSchedule = !!schedulesByDay[dayKey]?.length;
                const selected = isSameDay(cell, selectedDate);
                const isToday = isSameDay(cell, today);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.cell, selected && styles.cellSelected]}
                    onPress={() => handleSelectDay(cell)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.cellNum,
                      isToday && styles.cellNumToday,
                      selected && styles.cellNumSelected,
                      cell.getDay() === 0 && { color: colors.accentRose },
                    ]}>{cell.getDate()}</Text>
                    {hasSchedule && <View style={styles.cellDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Selected-day list */}
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>
              {t('schedule.dayHeader', {
                month: selectedDate.getMonth() + 1,
                day: selectedDate.getDate(),
              })}
            </Text>
          </View>

          {selectedDaySchedules.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('schedule.emptyDay')}</Text>
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              {selectedDaySchedules.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.itemCard}
                  onPress={() => openEdit(s)}
                  activeOpacity={0.75}
                >
                  <View style={styles.itemTimeCol}>
                    <Text style={styles.itemTime}>
                      {s.isAllDay ? t('schedule.allDay') : fmtTime(s.startAt)}
                    </Text>
                    {!s.isAllDay && s.endAt && (
                      <Text style={styles.itemTimeEnd}>~ {fmtTime(s.endAt)}</Text>
                    )}
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{s.title}</Text>
                    {s.note ? (
                      <Text style={styles.itemNote} numberOfLines={2}>{s.note}</Text>
                    ) : null}
                    {s.linkedDiaryId ? (
                      <Text style={styles.itemLinked}>{t('schedule.linkedBadge')}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 80 }]}
          onPress={openCreate}
          activeOpacity={0.85}
        >
          <View style={styles.fabPlusH} />
          <View style={styles.fabPlusV} />
        </TouchableOpacity>

        {/* Create/Edit modal */}
        <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={closeModal}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.xl }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>
                {editing ? t('schedule.edit') : t('schedule.new')}
              </Text>

              <Text style={styles.fieldLabel}>{t('schedule.fieldTitle')}</Text>
              <TextInput
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder={t('schedule.titlePlaceholder')}
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
                maxLength={100}
              />

              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>{t('schedule.allDay')}</Text>
                <Switch
                  value={formAllDay}
                  onValueChange={setFormAllDay}
                  trackColor={{ false: colors.accentSand + '40', true: colors.accentPrimaryLight }}
                  thumbColor={formAllDay ? colors.accentPrimary : colors.textTertiary}
                />
              </View>

              <Text style={styles.fieldLabel}>{t('schedule.fieldStart')}</Text>
              <TouchableOpacity style={styles.pickerRow} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.pickerText}>
                  {formStart.toLocaleString()}
                </Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={formStart}
                  mode={formAllDay ? 'date' : 'datetime'}
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_, d) => {
                    if (Platform.OS === 'android') setShowStartPicker(false);
                    if (d) setFormStart(d);
                  }}
                />
              )}

              <Text style={styles.fieldLabel}>{t('schedule.fieldEnd')}</Text>
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={[styles.pickerText, !formEnd && { color: colors.textTertiary }]}>
                  {formEnd ? formEnd.toLocaleString() : t('schedule.noEnd')}
                </Text>
                {formEnd && (
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); setFormEnd(null); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.clearText}>{t('schedule.clear')}</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={formEnd ?? formStart}
                  mode={formAllDay ? 'date' : 'datetime'}
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_, d) => {
                    if (Platform.OS === 'android') setShowEndPicker(false);
                    if (d) setFormEnd(d);
                  }}
                />
              )}

              <Text style={styles.fieldLabel}>{t('schedule.fieldNote')}</Text>
              <TextInput
                value={formNote}
                onChangeText={setFormNote}
                placeholder={t('schedule.notePlaceholder')}
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, styles.inputMultiline]}
                multiline
                maxLength={2000}
              />

              {editing?.linkedDiaryId ? (
                <TouchableOpacity style={styles.linkRow} onPress={openLinkedDiary}>
                  <Text style={styles.linkRowText}>{t('schedule.openLinkedDiary')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.linkRow} onPress={openWriteDiaryForSchedule}>
                  <Text style={styles.linkRowText}>{t('schedule.writeDiaryForThis')}</Text>
                </TouchableOpacity>
              )}

              <View style={styles.modalActions}>
                {editing && (
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
                    <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={closeModal}>
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg,
    paddingBottom: spacing.md, alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 22, color: colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: spacing['2xl'], paddingBottom: 140,
  },

  monthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.md, marginBottom: spacing.md,
  },
  monthArrow: {
    fontFamily: fontFamily.serifItalic, fontSize: 28, color: colors.textPrimary,
    paddingHorizontal: spacing.md,
  },
  monthTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 18, color: colors.textPrimary,
  },

  weekdayRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  weekdayLabel: {
    flex: 1, textAlign: 'center',
    fontFamily: fontFamily.sans, fontSize: 11, color: colors.textTertiary,
    letterSpacing: 0.5,
  },

  center: { paddingVertical: 40, alignItems: 'center' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginBottom: spacing.xl,
  },
  cell: {
    width: '14.2857%', aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  cellEmpty: { width: '14.2857%', aspectRatio: 1 },
  cellSelected: {
    backgroundColor: colors.accentPrimaryLight + '25',
  },
  cellNum: {
    fontFamily: fontFamily.sans, fontSize: 14, color: colors.textPrimary,
  },
  cellNumToday: {
    fontFamily: fontFamily.sansMedium, color: colors.accentPrimary, fontWeight: '700',
  },
  cellNumSelected: { color: colors.accentPrimary, fontWeight: '700' },
  cellDot: {
    position: 'absolute', bottom: 6,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.accentPrimary,
  },

  listHeader: {
    marginTop: spacing.lg, marginBottom: spacing.md,
  },
  listHeaderText: {
    fontFamily: fontFamily.serifItalic, fontSize: 16, color: colors.textSecondary,
  },

  emptyCard: {
    paddingVertical: spacing['2xl'], alignItems: 'center',
    backgroundColor: colors.bgIvory,
    borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  emptyText: {
    fontFamily: fontFamily.sans, fontSize: 13, color: colors.textTertiary,
  },

  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgIvory, borderRadius: borderRadius.sm,
    padding: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...shadows.crisp,
  },
  itemTimeCol: { width: 70, gap: 2 },
  itemTime: {
    fontFamily: fontFamily.sansMedium, fontSize: 15, color: colors.accentPrimary,
    fontWeight: '600',
  },
  itemTimeEnd: {
    fontFamily: fontFamily.sans, fontSize: 11, color: colors.textTertiary,
  },
  itemBody: { flex: 1, gap: 4 },
  itemTitle: {
    fontFamily: fontFamily.sansMedium, fontSize: 14, color: colors.textPrimary,
    fontWeight: '600',
  },
  itemNote: {
    fontFamily: fontFamily.sans, fontSize: 12, color: colors.textSecondary, lineHeight: 18,
  },
  itemLinked: {
    fontFamily: fontFamily.sans, fontSize: 10, color: colors.accentPrimary, marginTop: 4,
  },

  fab: {
    position: 'absolute', right: spacing['2xl'],
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: colors.accentPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  fabPlusH: { position: 'absolute', width: 18, height: 2, backgroundColor: colors.surfacePure, borderRadius: 1 },
  fabPlusV: { position: 'absolute', width: 2, height: 18, backgroundColor: colors.surfacePure, borderRadius: 1 },

  // Modal
  modalBackdrop: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(30, 25, 20, 0.35)',
  },
  modalSheet: {
    backgroundColor: colors.bgCream,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: spacing['2xl'], paddingTop: spacing.md,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.accentSand + '60',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fontFamily.serifItalic, fontSize: 18, color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontFamily: fontFamily.sansMedium, fontSize: 12, color: colors.textSecondary,
    marginTop: spacing.md, marginBottom: spacing.xs, fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surfacePure,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontFamily: fontFamily.sans, fontSize: 14, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.accentSand + '40',
  },
  inputMultiline: {
    minHeight: 80, textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.md,
  },
  pickerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surfacePure, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.accentSand + '40',
  },
  pickerText: {
    fontFamily: fontFamily.sans, fontSize: 14, color: colors.textPrimary,
  },
  clearText: {
    fontFamily: fontFamily.sans, fontSize: 12, color: colors.accentPrimary,
  },
  linkRow: {
    marginTop: spacing.lg, padding: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accentPrimaryLight + '20',
    alignItems: 'center',
  },
  linkRowText: {
    fontFamily: fontFamily.sansMedium, fontSize: 13, color: colors.accentPrimary,
  },

  modalActions: {
    flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl,
  },
  actionBtn: {
    flex: 1, paddingVertical: 14, borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: colors.accentRose,
  },
  deleteBtnText: {
    fontFamily: fontFamily.sansMedium, fontSize: 14, color: colors.accentRose,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: colors.accentSand + '60',
  },
  cancelBtnText: {
    fontFamily: fontFamily.sansMedium, fontSize: 14, color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.accentPrimary,
  },
  saveBtnText: {
    fontFamily: fontFamily.sansMedium, fontSize: 14, color: colors.surfacePure, fontWeight: '600',
  },
});
