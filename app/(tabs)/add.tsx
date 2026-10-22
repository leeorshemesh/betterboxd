import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { MediaArt } from '@/components/MediaArt';
import { MediaTypeIcon } from '@/components/MediaTypeIcon';
import { StarRating } from '@/components/StarRating';
import { colors, radii, spacing, typography, MEDIA_TYPE_SINGULAR } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { mediaService } from '@/services/mediaService';
import type { MediaItem, MediaType, MusicTargetKind } from '@/types';

const TYPES: MediaType[] = ['movie', 'show', 'book', 'music'];

export default function AddScreen() {
  const router = useRouter();
  const { addReview } = useAppState();

  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [season, setSeason] = useState<number | undefined>();
  const [episode, setEpisode] = useState<number | undefined>();
  const [musicKind, setMusicKind] = useState<MusicTargetKind | undefined>();
  const [rating, setRating] = useState(4);
  const [body, setBody] = useState('');
  const [tagText, setTagText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    mediaService.search({ query, type: mediaType }).then((items) => {
      if (!cancelled) setResults(items);
    });
    return () => {
      cancelled = true;
    };
  }, [query, mediaType]);

  useEffect(() => {
    setSelected(null);
    setSeason(undefined);
    setEpisode(undefined);
    setMusicKind(undefined);
    setQuery('');
  }, [mediaType]);

  const tags = useMemo(
    () =>
      tagText
        .split(/[,#\s]+/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    [tagText],
  );

  const seasonOptions = useMemo(() => {
    if (!selected?.seasons) return [];
    return Array.from({ length: selected.seasons }, (_, i) => i + 1);
  }, [selected]);

  const episodeOptions = useMemo(() => {
    if (!selected?.episodesPerSeason || season == null) return [];
    return Array.from({ length: selected.episodesPerSeason }, (_, i) => i + 1);
  }, [selected, season]);

  const canPost =
    !!selected && rating >= 0.5 && body.trim().length > 0 && !posting;

  const onPost = () => {
    if (!selected || !canPost) return;
    setPosting(true);
    try {
      const review = addReview({
        mediaId: selected.id,
        mediaType: selected.type,
        rating,
        body: body.trim(),
        tags,
        season,
        episode,
        musicKind: selected.type === 'music' ? musicKind ?? selected.musicKind : undefined,
      });
      setBody('');
      setTagText('');
      setSelected(null);
      setRating(4);
      router.push(`/review/${review.id}`);
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Log a review</Text>
      <Text style={styles.sub}>Pick a type, find the title, rate it, write it up.</Text>

      <Text style={styles.label}>Media type</Text>
      <View style={styles.typeRow}>
        {TYPES.map((t) => {
          const active = mediaType === t;
          const tint = active ? colors.accent : colors.textSecondary;
          return (
            <Pressable
              key={t}
              onPress={() => setMediaType(t)}
              style={[styles.typeChip, active && styles.typeChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={MEDIA_TYPE_SINGULAR[t]}
            >
              <MediaTypeIcon type={t} size={18} color={tint} />
              <Text style={[styles.typeText, active && styles.typeTextActive]}>
                {MEDIA_TYPE_SINGULAR[t]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Search</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={`Search ${MEDIA_TYPE_SINGULAR[mediaType].toLowerCase()}s…`}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCorrect={false}
      />

      {!selected && (
        <View style={styles.results}>
          {results.slice(0, 8).map((item) => (
            <Pressable key={item.id} style={styles.resultRow} onPress={() => {
              setSelected(item);
              if (item.type === 'music') setMusicKind(item.musicKind);
            }}>
              <MediaArt media={item} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultSub}>
                  {item.subtitle}
                  {item.musicKind ? ` · ${item.musicKind}` : ''}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {selected && (
        <View style={styles.selected}>
          <MediaArt media={selected} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedTitle}>{selected.title}</Text>
            <Text style={styles.resultSub}>{selected.subtitle}</Text>
            <Pressable onPress={() => setSelected(null)}>
              <Text style={styles.change}>Change</Text>
            </Pressable>
          </View>
        </View>
      )}

      {selected?.type === 'show' && (
        <>
          <Text style={styles.label}>Season (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Pressable
              onPress={() => { setSeason(undefined); setEpisode(undefined); }}
              style={[styles.smallChip, season == null && styles.smallChipActive]}
            >
              <Text style={styles.smallChipText}>Whole show</Text>
            </Pressable>
            {seasonOptions.map((s) => (
              <Pressable
                key={s}
                onPress={() => { setSeason(s); setEpisode(undefined); }}
                style={[styles.smallChip, season === s && styles.smallChipActive]}
              >
                <Text style={styles.smallChipText}>S{s}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {season != null && (
            <>
              <Text style={styles.label}>Episode (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <Pressable
                  onPress={() => setEpisode(undefined)}
                  style={[styles.smallChip, episode == null && styles.smallChipActive]}
                >
                  <Text style={styles.smallChipText}>Whole season</Text>
                </Pressable>
                {episodeOptions.map((e) => (
                  <Pressable
                    key={e}
                    onPress={() => setEpisode(e)}
                    style={[styles.smallChip, episode === e && styles.smallChipActive]}
                  >
                    <Text style={styles.smallChipText}>E{e}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </>
      )}

      {selected?.type === 'music' && (
        <>
          <Text style={styles.label}>Target</Text>
          <View style={styles.typeRow}>
            {(['song', 'album', 'artist'] as MusicTargetKind[]).map((k) => (
              <Pressable
                key={k}
                onPress={() => setMusicKind(k)}
                style={[styles.typeChip, musicKind === k && styles.typeChipActive]}
              >
                <Text style={[styles.typeText, musicKind === k && styles.typeTextActive]}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Rating</Text>
      <StarRating value={rating} onChange={setRating} size={32} showValue />

      <Text style={styles.label}>Review</Text>
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="What stuck with you?"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.bodyInput]}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>Tags</Text>
      <TextInput
        value={tagText}
        onChangeText={setTagText}
        placeholder="thriller, rewatch, s2e7…"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
      />
      {tags.length > 0 && (
        <Text style={styles.tagPreview}>{tags.map((t) => `#${t}`).join('  ')}</Text>
      )}

      <Pressable
        onPress={onPost}
        disabled={!canPost}
        style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
      >
        <Text style={styles.postText}>{posting ? 'Posting…' : 'Post review'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: 4 },
  heading: { ...typography.display, color: colors.text, fontSize: 24 },
  sub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentDim,
  },
  typeText: { ...typography.label, color: colors.textSecondary },
  typeTextActive: { color: colors.accent },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
  },
  bodyInput: { minHeight: 120 },
  results: { marginTop: spacing.sm, gap: 2 },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  resultTitle: { ...typography.headline, color: colors.text, fontSize: 14 },
  resultSub: { ...typography.caption, color: colors.textMuted },
  selected: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTitle: { ...typography.headline, color: colors.text },
  change: { ...typography.label, color: colors.accent, marginTop: 6 },
  chipRow: { gap: spacing.sm, paddingVertical: 4 },
  smallChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallChipActive: {
    borderColor: colors.teal,
    backgroundColor: 'rgba(94,196,184,0.12)',
  },
  smallChipText: { ...typography.caption, color: colors.text },
  tagPreview: { ...typography.caption, color: colors.teal, marginTop: spacing.sm },
  postBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.4 },
  postText: {
    ...typography.bodyBold,
    color: colors.bg,
    fontSize: 16,
  },
});
