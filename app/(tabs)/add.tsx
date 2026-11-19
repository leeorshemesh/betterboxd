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
import { ApiError } from '@/services/api';
import { mediaService } from '@/services/mediaService';
import { loadPreferences } from '@/services/preferences';
import type { MediaItem, MediaType, MusicTargetKind } from '@/types';

const TYPES: MediaType[] = ['movie', 'show', 'book', 'music'];

function today(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function AddScreen() {
  const router = useRouter();
  const { logTitle } = useAppState();

  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [season, setSeason] = useState<number | undefined>();
  const [episode, setEpisode] = useState<number | undefined>();
  const [musicKind, setMusicKind] = useState<MusicTargetKind | undefined>();
  const [loggedOn, setLoggedOn] = useState(today);
  const [rating, setRating] = useState(4);
  const [body, setBody] = useState('');
  const [tagText, setTagText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingShowMeta, setLoadingShowMeta] = useState(false);

  useEffect(() => {
    void loadPreferences().then((prefs) => setMediaType(prefs.defaultAddType));
  }, []);

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
    setLoadingShowMeta(false);
  }, [mediaType]);

  const selectTitle = async (item: MediaItem) => {
    setSeason(undefined);
    setEpisode(undefined);
    if (item.type === 'music') setMusicKind(item.musicKind);
    else setMusicKind(undefined);

    if (item.type === 'show' && !item.seasons) {
      setSelected(item);
      setLoadingShowMeta(true);
      try {
        const detailed = await mediaService.getById(item.id);
        setSelected(detailed ?? item);
      } finally {
        setLoadingShowMeta(false);
      }
      return;
    }
    setSelected(item);
  };

  const tags = useMemo(
    () =>
      tagText
        .split(/[,#\s]+/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    [tagText],
  );

  const seasonCount = selected?.seasons && selected.seasons > 0 ? selected.seasons : 0;
  const seasonOptions = useMemo(() => {
    if (seasonCount > 0) {
      return Array.from({ length: seasonCount }, (_, i) => i + 1);
    }
    // Fallback when provider didn't return a season count — still allow S1–S20.
    if (selected?.type === 'show') {
      return Array.from({ length: 20 }, (_, i) => i + 1);
    }
    return [];
  }, [selected, seasonCount]);

  const episodeOptions = useMemo(() => {
    if (season == null) return [];
    const count =
      selected?.episodesPerSeason && selected.episodesPerSeason > 0
        ? selected.episodesPerSeason
        : 24;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [selected, season]);

  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(loggedOn);
  const canLog = !!selected && dateValid && !posting;
  const canReview = canLog && body.trim().length > 0;

  const onSubmit = async (withReview: boolean) => {
    if (!selected || !canLog) return;
    if (withReview && !canReview) return;
    setPosting(true);
    setError(null);
    try {
      const result = await logTitle({
        media: selected,
        loggedOn,
        rating,
        body: withReview ? body.trim() : undefined,
        tags: withReview ? tags : [],
        season,
        episode,
        musicKind: selected.type === 'music' ? musicKind ?? selected.musicKind : undefined,
      });
      setBody('');
      setTagText('');
      setSelected(null);
      setRating(4);
      setLoggedOn(today());
      if (result.review) router.push(`/review/${result.review.id}`);
      else router.push(`/media/${selected.type}/${selected.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save');
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Log a title</Text>
      <Text style={styles.sub}>Pick a title and the day. A written review is optional.</Text>

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
            <Pressable
              key={item.id}
              style={styles.resultRow}
              onPress={() => void selectTitle(item)}
            >
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
            <Text style={styles.resultSub}>
              {selected.subtitle}
              {selected.type === 'show' && selected.seasons
                ? ` · ${selected.seasons} season${selected.seasons === 1 ? '' : 's'}`
                : ''}
            </Text>
            <Pressable onPress={() => setSelected(null)}>
              <Text style={styles.change}>Change</Text>
            </Pressable>
          </View>
        </View>
      )}

      {selected?.type === 'show' && (
        <>
          <Text style={styles.label}>What are you logging?</Text>
          {loadingShowMeta ? (
            <Text style={styles.metaHint}>Loading seasons…</Text>
          ) : (
            <Text style={styles.metaHint}>
              {seasonCount > 0
                ? 'Whole show, a single season, or a specific episode.'
                : 'Pick a season number (episode list uses a default length if unknown).'}
            </Text>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <Pressable
              onPress={() => {
                setSeason(undefined);
                setEpisode(undefined);
              }}
              style={[styles.smallChip, season == null && styles.smallChipActive]}
            >
              <Text
                style={[
                  styles.smallChipText,
                  season == null && styles.smallChipTextActive,
                ]}
              >
                Whole show
              </Text>
            </Pressable>
            {seasonOptions.map((s) => (
              <Pressable
                key={s}
                onPress={() => {
                  setSeason(s);
                  setEpisode(undefined);
                }}
                style={[styles.smallChip, season === s && styles.smallChipActive]}
              >
                <Text
                  style={[
                    styles.smallChipText,
                    season === s && styles.smallChipTextActive,
                  ]}
                >
                  Season {s}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {season != null && (
            <>
              <Text style={styles.label}>Episode (optional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <Pressable
                  onPress={() => setEpisode(undefined)}
                  style={[styles.smallChip, episode == null && styles.smallChipActive]}
                >
                  <Text
                    style={[
                      styles.smallChipText,
                      episode == null && styles.smallChipTextActive,
                    ]}
                  >
                    Whole season
                  </Text>
                </Pressable>
                {episodeOptions.map((e) => (
                  <Pressable
                    key={e}
                    onPress={() => setEpisode(e)}
                    style={[styles.smallChip, episode === e && styles.smallChipActive]}
                  >
                    <Text
                      style={[
                        styles.smallChipText,
                        episode === e && styles.smallChipTextActive,
                      ]}
                    >
                      E{e}
                    </Text>
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

      <Text style={styles.label}>Date</Text>
      <TextInput
        value={loggedOn}
        onChangeText={setLoggedOn}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={() => void onSubmit(false)}
        disabled={!canLog}
        style={[styles.secondaryBtn, !canLog && styles.postBtnDisabled]}
      >
        <Text style={styles.secondaryText}>{posting ? 'Saving…' : 'Log without review'}</Text>
      </Pressable>
      <Pressable
        onPress={() => void onSubmit(true)}
        disabled={!canReview}
        style={[styles.postBtn, !canReview && styles.postBtnDisabled]}
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
  metaHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  chipRow: { gap: spacing.sm, paddingVertical: 4, paddingRight: spacing.lg },
  smallChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallChipActive: {
    borderColor: colors.accentDim,
    backgroundColor: colors.accentSoft,
  },
  smallChipText: { ...typography.caption, color: colors.textSecondary },
  smallChipTextActive: { color: colors.accent, fontFamily: 'DMSans_600SemiBold' },
  tagPreview: { ...typography.caption, color: colors.teal, marginTop: spacing.sm },
  error: { ...typography.body, color: colors.coral, marginTop: spacing.md },
  secondaryBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: { ...typography.bodyBold, color: colors.text, fontSize: 16 },
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
