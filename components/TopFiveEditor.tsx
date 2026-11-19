import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MediaArt } from '@/components/MediaArt';
import { MediaTypeIcon, labelForMediaFilter } from '@/components/MediaTypeIcon';
import { colors, radii, spacing, typography, MEDIA_TYPE_LABELS } from '@/constants/theme';
import type { DiaryEntry, TopFiveConfig, TopFiveMode, TopFiveSlot } from '@/types';
import {
  candidatesForMode,
  slotsForMode,
  slotsForModeSave,
} from '@/utils/topFive';

const MODES: TopFiveMode[] = ['mixed', 'movie', 'show', 'book', 'music'];

interface TopFiveEditorProps {
  config: TopFiveConfig;
  diary: DiaryEntry[];
  onModeChange: (mode: TopFiveMode) => void;
  onSave: (mode: TopFiveMode, slots: TopFiveSlot[]) => Promise<void>;
}

export function TopFiveEditor({ config, diary, onModeChange, onSave }: TopFiveEditorProps) {
  const [mode, setMode] = useState<TopFiveMode>(config.mode);
  const [draft, setDraft] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pool = useMemo(() => candidatesForMode(diary, mode), [diary, mode]);
  const visible = useMemo(
    () => slotsForMode({ ...config, mode }, diary),
    [config, mode, diary],
  );

  useEffect(() => {
    setMode(config.mode);
  }, [config.mode]);

  useEffect(() => {
    setDraft(visible.map((slot) => slot.mediaId));
    setMessage(null);
  }, [mode, config.slotsByMode]);

  const selectMode = (next: TopFiveMode) => {
    setMode(next);
    onModeChange(next);
  };

  const toggle = (mediaId: string) => {
    setDraft((prev) => {
      if (prev.includes(mediaId)) return prev.filter((id) => id !== mediaId);
      if (prev.length >= 5) return prev;
      return [...prev, mediaId];
    });
    setMessage(null);
  };

  const clearAll = () => {
    setDraft([]);
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await onSave(mode, slotsForModeSave(draft));
      setMessage('Top Five saved');
    } catch {
      setMessage('Could not save Top Five');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Each view is its own list of up to five. Mixed is your all-time entertainment top five — not
        a merge of the others.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modeRow}
      >
        {MODES.map((option) => {
          const active = mode === option;
          const tint = active ? colors.accent : colors.textSecondary;
          return (
            <Pressable
              key={option}
              onPress={() => selectMode(option)}
              style={[styles.modeChip, active && styles.modeChipActive]}
            >
              <MediaTypeIcon type={option} size={14} color={tint} />
              <Text style={[styles.modeText, active && styles.modeTextActive]}>
                {labelForMediaFilter(option)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.subLabel}>
        {mode === 'mixed' ? 'All-time mixed' : `Top ${MEDIA_TYPE_LABELS[mode]}`} · {draft.length}/5
      </Text>

      {draft.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.currentRow}
        >
          {draft.map((mediaId, index) => {
            const media = pool.find((item) => item.id === mediaId);
            if (!media) return null;
            return (
              <Pressable key={mediaId} onPress={() => toggle(mediaId)} style={styles.currentSlot}>
                <Text style={styles.rank}>#{index + 1}</Text>
                <MediaArt media={media} size={64} />
                <Text style={styles.currentTitle} numberOfLines={2}>
                  {media.title}
                </Text>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.empty}>No titles in this view yet.</Text>
      )}

      <View style={styles.actions}>
        <Pressable onPress={clearAll} style={styles.ghostBtn}>
          <Text style={styles.ghostText}>Clear this view</Text>
        </Pressable>
        <Pressable
          onPress={() => void save()}
          disabled={saving}
          style={[styles.saveBtn, saving && styles.saveDisabled]}
        >
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save Top Five'}</Text>
        </Pressable>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Text style={styles.subLabel}>From your diary</Text>
      {pool.length === 0 ? (
        <Text style={styles.empty}>Log some titles first, then pin them here.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pool}
        >
          {pool.map((media) => {
            const selected = draft.includes(media.id);
            return (
              <Pressable
                key={media.id}
                onPress={() => toggle(media.id)}
                style={[styles.poolItem, selected && styles.poolItemActive]}
              >
                <MediaArt media={media} size={56} />
                <Text style={styles.poolTitle} numberOfLines={2}>
                  {media.title}
                </Text>
                <Text style={styles.poolState}>{selected ? 'Selected' : 'Add'}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  hint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  modeRow: { gap: spacing.sm, paddingVertical: 4 },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentDim,
  },
  modeText: { ...typography.label, color: colors.textSecondary, fontSize: 12 },
  modeTextActive: { color: colors.accent },
  subLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    marginTop: spacing.md,
  },
  currentRow: { gap: spacing.md, paddingVertical: spacing.sm },
  currentSlot: { width: 80, gap: 4 },
  rank: {
    ...typography.caption,
    color: colors.accent,
    fontFamily: 'DMSans_600SemiBold',
  },
  currentTitle: { ...typography.caption, color: colors.textSecondary },
  remove: { ...typography.caption, color: colors.coral, fontSize: 11 },
  empty: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  ghostBtn: { paddingVertical: 10, paddingHorizontal: 4 },
  ghostText: { ...typography.label, color: colors.textSecondary },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { ...typography.bodyBold, color: colors.bg },
  message: { ...typography.caption, color: colors.teal },
  pool: { gap: spacing.md, paddingVertical: spacing.sm },
  poolItem: { width: 72, gap: 4, opacity: 0.75 },
  poolItemActive: { opacity: 1 },
  poolTitle: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
  poolState: { ...typography.caption, color: colors.accent, fontSize: 10 },
});
