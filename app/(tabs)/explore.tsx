import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';

import { FilterChips } from '@/components/FilterChips';
import { MediaArt } from '@/components/MediaArt';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { mediaService } from '@/services/mediaService';
import type { FeedFilter, MediaItem } from '@/types';

export default function ExploreScreen() {
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | undefined>();
  const [genres, setGenres] = useState<string[]>([]);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const items = await mediaService.search({
        query,
        type: filter === 'all' ? undefined : filter,
        genre,
      });
      setResults(items);
    } finally {
      setLoading(false);
    }
  }, [query, filter, genre]);

  useEffect(() => {
    mediaService.listGenres().then(setGenres);
  }, []);

  useEffect(() => {
    const t = setTimeout(runSearch, 150);
    return () => clearTimeout(t);
  }, [runSearch]);

  return (
    <View style={styles.screen}>
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search titles, people, genres…"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <FilterChips value={filter} onChange={(v) => { setFilter(v); setGenre(undefined); }} />

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

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No titles match that search.</Text>
          }
          renderItem={({ item }) => (
            <Link href={`/media/${item.type}/${item.id}`} asChild>
              <Pressable style={styles.row}>
                <MediaArt media={item} size={56} />
                <View style={styles.meta}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {item.subtitle}
                    {item.year ? ` · ${item.year}` : ''}
                  </Text>
                  <Text style={styles.genres} numberOfLines={1}>
                    {item.genres.join(' · ')}
                  </Text>
                </View>
              </Pressable>
            </Link>
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
  genreList: {
    height: 44,
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.sm,
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    ...typography.headline,
    color: colors.text,
  },
  sub: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  genres: {
    ...typography.caption,
    color: colors.textMuted,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
