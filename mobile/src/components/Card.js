import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLang } from '../contexts/LangContext';
import { Colors, BorderRadius, Spacing } from '../theme/colors';

export function Card({ children, style, onPress }) {
  const { dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const cardStyle = [styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }, style];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

export function SectionTitle({ children, style }) {
  const { dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  return <Text style={[styles.sectionTitle, { color: c.text }, style]}>{children}</Text>;
}

export function Badge({ children, color, textColor, style }) {
  return (
    <View style={[styles.badge, { backgroundColor: color || '#e8f5e9' }, style]}>
      <Text style={[styles.badgeText, { color: textColor || '#1a6b3a' }]}>{children}</Text>
    </View>
  );
}

export function SearchInput({ value, onChangeText, placeholder, style }) {
  const { dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  return (
    <View style={[styles.searchWrap, { backgroundColor: c.inputBg, borderColor: c.border }, style]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <View style={{ flex: 1 }}>
        <TextInputNative
          style={[styles.searchInput, { color: c.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
        />
      </View>
    </View>
  );
}

import { TextInput as TextInputNative } from 'react-native';

export function SearchBar({ value, onChangeText, placeholder }) {
  const { dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  return (
    <View style={[styles.searchWrap, { backgroundColor: c.inputBg, borderColor: c.border }]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInputNative
        style={[styles.searchInput, { color: c.text, flex: 1 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
      />
    </View>
  );
}

export function TagFilter({ tags, active, onSelect }) {
  const { dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  return (
    <View style={styles.tagRow}>
      {tags.map(tag => (
        <TouchableOpacity
          key={tag}
          style={[styles.tag, active === tag ? { backgroundColor: c.primary } : { backgroundColor: c.surfaceAlt }]}
          onPress={() => onSelect(tag)}
        >
          <Text style={[styles.tagText, active === tag ? { color: '#fff' } : { color: c.textSecondary }]}>
            {tag}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function EmptyState({ icon, message }) {
  const { dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon || '📭'}</Text>
      <Text style={[styles.emptyText, { color: c.textMuted }]}>{message}</Text>
    </View>
  );
}

export function LoadingSpinner({ message }) {
  const { dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  return (
    <View style={styles.loading}>
      <Text style={styles.loadingIcon}>⏳</Text>
      {message && <Text style={[styles.loadingText, { color: c.textMuted }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: Spacing.md,
    height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { fontSize: 15, height: 44 },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  tagText: { fontSize: 13, fontWeight: '500' },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15 },
  loading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingIcon: { fontSize: 32, marginBottom: 8 },
  loadingText: { fontSize: 14 },
});
