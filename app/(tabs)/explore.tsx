import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, type Href } from 'expo-router';

import { FilterChips } from '@/components/FilterChips';
import { MediaArt } from '@/components/MediaArt';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import {
  mediaService,
  refreshMediaProviderStatus,
} from '@/services/mediaService';
import { loadPreferences } from '@/services/preferences';
import { buildForYou } from '@/services/recommendations';
import type { FeedFilter, MediaItem } from '@/types';

const RECENT_LIMIT = 6;

export default function ExploreScreen() {
  const { diary, reviews, lists, currentUser } = useAppState();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | undefined>();
  const [genres, setGenres] = useState<string[]>([]);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [forYou, setForYou] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [usedMockFallback, setUsedMockFallback] = useState(false);
  const [tmdbLive, setTmdbLive] = useState(true);
  const [spotifyLive, setSpotifyLive] = useState(true);

  const showBrowse = !query.trim() && !genre;
  const listMediaIds = useMemo(() => lists.flatMap((list) => list.mediaIds), [lists]);
  const friendReviews = useMemo(
    () => reviews.filter((review) => review.userId !== currentUser.id),
    [reviews, currentUser.id],
  );

  useEffect(() => {
    loadPreferences().then((p) => setFilter(p.defaultExploreFilter));
    mediaService.listGenres().then(setGenres);
    void refreshMediaProviderStatus().then((p) => {
      setTmdbLive(p.tmdb);
      setSpotifyLive(p.spotify);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingRecs(true);
    void buildForYou({ diary, friendReviews, listMediaIds })
      .then((items) => {
        if (!cancelled) setForYou(items);
      })
      .finally(() => {
        if (!cancelled) setLoadingRecs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [diary, friendReviews, listMediaIds]);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const items = await mediaService.search({
        query,
        type: filter === 'all' ? undefined : filter,
        genre,
      });
      setResults(items);
      const filmNeedsKey = filter === 'all' || filter === 'movie' || filter === 'show';
      setUsedMockFallback(filmNeedsKey && !tmdbLive);
    } finally {
      setLoading(false);
    }
  }, [query, filter, genre, tmdbLive]);

  useEffect(() => {
    const t = setTimeout(runSearch, 180);
    return () => clearTimeout(t);
  }, [runSearch]);

  const rememberQuery = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    setRecent((prev) => [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, RECENT_LIMIT));
  };

  const emptyMessage = (() => {
    if (query.trim() || genre) return 'No titles match that search.';
    if (usedMockFallback) {
      return 'Showing sample titles. Live catalog needs TMDB_API_KEY on the server.';
    }
    return 'Browse popular titles, or type to search.';
  })();

  const filteredForYou =
    filter === 'all' ? forYou : forYou.filter((item) => item.type === filter);

  const header = (
    <View>
      {recent.length > 0 && !query ? (
        <View style={styles.recentWrap}>
          <Text style={styles.recentLabel}>Recent</Text>
          <View style={styles.recentRow}>
            {recent.map((item) => (
              <Pressable
                key={item}
                onPress={() => setQuery(item)}
                style={styles.recentChip}
                hitSlop={4}
              >
                <Text style={styles.recentText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <FlatList
        horizontal
        nestedScrollEnabled
        data={['All genres', ...genres]}
        keyExtractor={(g) => g}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.genreRow}
        style={styles.genreList}
        renderItem={({ item }) => {
          const active = item === 'All genres' ? !genre : genre === item;
          return (
            <Pressable
              onPress={() => setGenre(item === 'All genres' ? undefined : item)}
              style={[styles.genreChip, active && styles.genreChipActive]}
              hitSlop={4}
            >
              <Text style={[styles.genreText, active && styles.genreTextActive]}>{item}</Text>
            </Pressable>
          );
        }}
      />

      {usedMockFallback ? (
        <Text style={styles.banner}>
          Live film data needs TMDB_API_KEY on the server
          {!spotifyLive ? ' · music is on sample catalog' : ''}.
        </Text>
      ) : null}

      {showBrowse ? (
        <View style={styles.forYouBlock}>
          <Text style={styles.forYouTitle}>For you</Text>
          <Text style={styles.forYouHint}>
            From your high ratings and friends’ favorites you haven’t logged.
          </Text>
          {loadingRecs ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 12 }} />
          ) : filteredForYou.length === 0 ? (
            <Text style={styles.forYouEmpty}>
              Log a few titles you love (4★+) to unlock personalized picks.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forYouRow}
            >
              {filteredForYou.map((item) => (
                <Link key={item.id} href={`/media/${item.type}/${item.id}`} asChild>
                  <Pressable style={styles.forYouCard}>
                    <MediaArt media={item} size={88} />
                    <Text style={styles.forYouCardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </ScrollView>
          )}
          <Text style={styles.browseLabel}>Browse</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => rememberQuery(query)}
          onBlur={() => rememberQuery(query)}
          placeholder="Search titles, people, genres…"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      <FilterChips
        value={filter}
        onChange={(v) => {
          setFilter(v);
          setGenre(undefined);
        }}
      />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Link href={`/media/${item.type}/${item.id}`} asChild>
                <Pressable style={styles.rowMain}>
                  <MediaArt media={item} size={56} />
                  <View style={styles.meta}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.sub} numberOfLines={1}>
                      {item.subtitle}
                      {item.year ? ` · ${item.year}` : ''}
                    </Text>
                    <Text style={styles.genresLine} numberOfLines={1}>
                      {item.genres.join(' · ')}
                    </Text>
                  </View>
                </Pressable>
              </Link>
              <Link
                href={
                  {
                    pathname: '/(tabs)/add',
                    params: { mediaId: item.id, type: item.type },
                  } as Href
                }
                asChild
              >
                <Pressable style={styles.addBtn} hitSlop={6}>
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
              </Link>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  search: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
  },
  recentWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  recentLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 6,
  },
  recentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  recentChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  banner: {
    ...typography.caption,
    color: colors.amber,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  forYouBlock: {
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  forYouTitle: {
    ...typography.title,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    fontSize: 18,
  },
  forYouHint: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  forYouEmpty: {
    ...typography.body,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  forYouRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  forYouCard: {
    width: 96,
    gap: 6,
  },
  forYouCardTitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  browseLabel: {
    ...typography.title,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    fontSize: 18,
    marginTop: spacing.sm,
  },
  genreList: {
    height: 44,
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  genreRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
    minHeight: 44,
  },
  genreChip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  genreChipActive: {
    borderColor: colors.teal,
    backgroundColor: 'rgba(94,196,184,0.12)',
  },
  genreText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  genreTextActive: {
    color: colors.teal,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  addBtn: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentDim,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnText: {
    ...typography.label,
    color: colors.accent,
  },
  title: {
    ...typography.headline,
    color: colors.text,
  },
  sub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  genresLine: {
    ...typography.caption,
    color: colors.textMuted,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
});
