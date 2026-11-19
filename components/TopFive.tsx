import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { MediaArt } from '@/components/MediaArt';
import { MediaTypeIcon, labelForMediaFilter } from '@/components/MediaTypeIcon';
import { colors, radii, spacing, typography, MEDIA_TYPE_LABELS } from '@/constants/theme';
import type { DiaryEntry, TopFiveConfig, TopFiveMode } from '@/types';
import { slotsForMode } from '@/utils/topFive';

const MODES: TopFiveMode[] = ['mixed', 'movie', 'show', 'book', 'music'];

interface TopFiveProps {
  config: TopFiveConfig;
  onModeChange: (mode: TopFiveMode) => void;
  diary?: DiaryEntry[];
  onEdit?: () => void;
  editing?: boolean;
}

/** Profile showcase — mode chips filter what’s shown. */
export function TopFive({
  config,
  onModeChange,
  diary = [],
  onEdit,
  editing = false,
}: TopFiveProps) {
  const visible = slotsForMode(config, diary);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Top Five</Text>
          <Text style={styles.hint}>
            {config.mode === 'mixed'
              ? 'All-time entertainment picks'
              : `Top ${MEDIA_TYPE_LABELS[config.mode]}`}
          </Text>
        </View>
        {onEdit ? (
          <Pressable onPress={onEdit} style={styles.editBtn} hitSlop={8}>
            <Text style={styles.editText}>{editing ? 'Done' : 'Edit'}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modeRow}
      >
        {MODES.map((mode) => {
          const active = config.mode === mode;
          const label = labelForMediaFilter(mode);
          const tint = active ? colors.accent : colors.textSecondary;
          return (
            <Pressable
              key={mode}
              onPress={() => onModeChange(mode)}
              style={[styles.modeChip, active && styles.modeChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
            >
              <View style={styles.modeInner}>
                <MediaTypeIcon type={mode} size={15} color={tint} />
                <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slots}
      >
        {visible.map((slot) => (
          <Link
            key={`${slot.rank}-${slot.mediaId}`}
            href={`/media/${slot.media.type}/${slot.media.id}`}
            asChild
          >
            <Pressable style={styles.slot}>
              <Text style={styles.rank}>#{slot.rank}</Text>
              <MediaArt media={slot.media} size={72} />
              <Text style={styles.slotTitle} numberOfLines={2}>
                {slot.media.title}
              </Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>

      {visible.length === 0 ? (
        <Text style={styles.empty}>
          Nothing pinned for this view yet. Tap Edit next to Top Five to add favorites from your
          diary.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  heading: {
    ...typography.title,
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  editBtn: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentDim,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editText: {
    ...typography.label,
    color: colors.accent,
  },
  modeRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentDim,
  },
  modeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeText: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 12,
  },
  modeTextActive: {
    color: colors.accent,
  },
  slots: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  slot: {
    width: 88,
    gap: 6,
  },
  rank: {
    ...typography.caption,
    color: colors.accent,
    fontFamily: 'DMSans_600SemiBold',
  },
  slotTitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  empty: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
});
