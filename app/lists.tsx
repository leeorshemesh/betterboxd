import { Link, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MediaArt } from '@/components/MediaArt';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { useAppState } from '@/context/AppState';
import { ApiError } from '@/services/api';
import { getMediaSync, mediaService } from '@/services/mediaService';
import type { MediaItem, MediaList, MediaType } from '@/types';

const LIST_META: Record<
  MediaList['kind'],
  { short: string; searchType: MediaType | 'film'; hint: string }
> = {
  'to-watch': {
    short: 'Watch',
    searchType: 'film',
    hint: 'Search movies and shows to add',
  },
  'to-read': {
    short: 'Read',
    searchType: 'book',
    hint: 'Search books to add',
  },
  'to-listen': {
    short: 'Listen',
    searchType: 'music',
    hint: 'Search music to add',
  },
  custom: {
    short: 'Custom',
    searchType: 'film',
    hint: 'Search titles to add',
  },
};

export default function ListsScreen() {
  const { lists, addToList, removeFromList } = useAppState();
  const ordered = useMemo(
    () =>
      [...lists].sort((a, b) => {
        const order = ['to-watch', 'to-read', 'to-listen', 'custom'];
        return order.indexOf(a.kind) - order.indexOf(b.kind);
      }),
    [lists],
  );
  const [selectedId, setSelectedId] = useState(ordered[0]?.id);
  const [resolved, setResolved] = useState<Record<string, MediaItem | null>>({});
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selected = ordered.find((list) => list.id === selectedId) ?? ordered[0];
  const meta = selected ? LIST_META[selected.kind] : LIST_META['to-watch'];

  const items = useMemo(() => {
    if (!selected) return [];
    return selected.mediaIds.map((id) => {
      const sync = getMediaSync(id) ?? resolved[id] ?? null;
      return { id, media: sync };
    });
  }, [selected, resolved]);

  useEffect(() => {
    setQuery('');
    setResults([]);
  }, [selectedId]);

  useEffect(() => {
    if (!selected) return;
    for (const id of selected.mediaIds) {
      if (getMediaSync(id) || resolved[id] !== undefined) continue;
      void mediaService.getById(id).then((media) => {
        setResolved((prev) => ({ ...prev, [id]: media }));
      });
    }
  }, [selected, resolved]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          let found: MediaItem[] = [];
          if (meta.searchType === 'film') {
            const [movies, shows] = await Promise.all([
              mediaService.search({ query: trimmed, type: 'movie' }),
              mediaService.search({ query: trimmed, type: 'show' }),
            ]);
            found = [...movies, ...shows];
          } else {
            found = await mediaService.search({ query: trimmed, type: meta.searchType });
          }
          if (!cancelled) setResults(found.slice(0, 12));
        } finally {
          if (!cancelled) setSearching(false);
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, meta.searchType]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const onAdd = async (media: MediaItem) => {
    setBusyId(media.id);
    try {
      const result = await addToList(media);
      showToast(result.added ? `Added to ${result.list.name}` : `Already on ${result.list.name}`);
      setQuery('');
      setResults([]);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Could not add');
    } finally {
      setBusyId(null);
    }
  };

  const onRemove = (list: MediaList, mediaId: string, title: string) => {
    Alert.alert('Remove from list', `Remove “${title}” from ${list.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void removeFromList(mediaId),
      },
    ]);
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.segment}>
        {ordered.map((list) => {
          const active = list.id === selected?.id;
          const label = LIST_META[list.kind]?.short ?? list.name;
          return (
            <Pressable
              key={list.id}
              onPress={() => setSelectedId(list.id)}
              style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                {label}
              </Text>
              <Text style={[styles.segmentCount, active && styles.segmentCountActive]}>
                {list.mediaIds.length}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.listTitle}>{selected?.name ?? 'Lists'}</Text>
      <Text style={styles.hint}>{meta.hint}</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={meta.hint}
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />

      {searching ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} />
      ) : null}

      {results.length > 0 ? (
        <View style={styles.results}>
          {results.map((item) => {
            const already = selected?.mediaIds.includes(item.id);
            return (
              <View key={item.id} style={styles.resultRow}>
                <MediaArt media={item} size={44} />
                <View style={styles.resultMeta}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.resultSub} numberOfLines={1}>
                    {item.subtitle}
                    {item.year ? ` · ${item.year}` : ''}
                  </Text>
                </View>
                <Pressable
                  style={[styles.addBtn, already && styles.addBtnDone]}
                  disabled={busyId === item.id || already}
                  onPress={() => void onAdd(item)}
                >
                  <Text style={[styles.addBtnText, already && styles.addBtnTextDone]}>
                    {already ? 'Added' : busyId === item.id ? '…' : 'Add'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}

      {toast ? <Text style={styles.toast}>{toast}</Text> : null}

      <Text style={styles.sectionLabel}>
        On this list · {selected?.mediaIds.length ?? 0}
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Lists' }} />
      <FlatList
        style={styles.screen}
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nothing here yet. Search above to add titles to this list.
          </Text>
        }
        renderItem={({ item }) => {
          const media = item.media;
          if (!media) {
            return (
              <View style={styles.row}>
                <Text style={styles.missing}>{item.id}</Text>
              </View>
            );
          }
          return (
            <View style={styles.row}>
              <Link href={`/media/${media.type}/${media.id}`} asChild>
                <Pressable style={styles.rowMain}>
                  <MediaArt media={media} size={56} />
                  <View style={styles.meta}>
                    <Text style={styles.title} numberOfLines={1}>
                      {media.title}
                    </Text>
                    <Text style={styles.sub} numberOfLines={1}>
                      {media.subtitle}
                      {media.year ? ` · ${media.year}` : ''}
                    </Text>
                  </View>
                </Pressable>
              </Link>
              {selected ? (
                <Pressable onPress={() => onRemove(selected, media.id, media.title)}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.sm,
    gap: 2,
  },
  segmentBtnActive: {
    backgroundColor: colors.accentSoft,
  },
  segmentLabel: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 13,
  },
  segmentLabelActive: {
    color: colors.accent,
  },
  segmentCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  segmentCountActive: {
    color: colors.accentDim,
  },
  listTitle: {
    ...typography.title,
    color: colors.text,
    fontSize: 20,
    marginTop: spacing.lg,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md,
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
  results: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  resultMeta: { flex: 1, gap: 2 },
  resultTitle: { ...typography.headline, color: colors.text, fontSize: 14 },
  resultSub: { ...typography.caption, color: colors.textMuted },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addBtnDone: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtnText: { ...typography.label, color: colors.bg },
  addBtnTextDone: { color: colors.textSecondary },
  toast: {
    ...typography.caption,
    color: colors.teal,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  list: { paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowMain: { flex: 1, flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  meta: { flex: 1, gap: 2 },
  title: { ...typography.headline, color: colors.text },
  sub: { ...typography.caption, color: colors.textMuted },
  missing: { ...typography.body, color: colors.textMuted },
  remove: { ...typography.label, color: colors.coral },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});
