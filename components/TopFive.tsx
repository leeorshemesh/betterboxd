import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { MediaArt } from '@/components/MediaArt';
import { MediaTypeIcon, labelForMediaFilter } from '@/components/MediaTypeIcon';
import { colors, radii, spacing, typography, MEDIA_TYPE_LABELS } from '@/constants/theme';
import { getMediaSync } from '@/services/mediaService';
import type { TopFiveConfig, TopFiveMode } from '@/types';

const MODES: TopFiveMode[] = ['mixed', 'movie', 'show', 'book', 'music'];

interface TopFiveProps {
  config: TopFiveConfig;
  onModeChange: (mode: TopFiveMode) => void;
}

export function TopFive({ config, onModeChange }: TopFiveProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.heading}>Top Five</Text>
        <Text style={styles.hint}>
          {config.mode === 'mixed' ? 'One of each type' : `Top ${MEDIA_TYPE_LABELS[config.mode]}`}
        </Text>
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
        {config.slots.map((slot) => {
          const media = getMediaSync(slot.mediaId);
          if (!media) return null;
          return (
            <Link key={`${slot.rank}-${slot.mediaId}`} href={`/media/${media.type}/${media.id}`} asChild>
              <Pressable style={styles.slot}>
                <Text style={styles.rank}>#{slot.rank}</Text>
                <MediaArt media={media} size={72} />
                <Text style={styles.slotTitle} numberOfLines={2}>
                  {media.title}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>
      <Text style={styles.editHint}>Editable via mock state — picker stub for later.</Text>
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
  editHint: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
});
