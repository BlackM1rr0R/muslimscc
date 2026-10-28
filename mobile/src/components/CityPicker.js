// ═══════════════════════════════════════════════════════
// CityPicker (mobil) — namaz şəhərinin axtarışlı seçicisi
// (veb src/components/CityPicker.jsx ilə eyni məntiq və eyni şəhər siyahısı)
//
// • Düymə: sancaq + seçilmiş şəhər + ox; basanda alt vərəq (Modal) açılır.
// • Vərəqdə axtarış sahəsi — yazdıqca süzür, diakritikasız və 5 dildə
//   ("seki" → Şəki, "gence" → Gəncə, "шеки"); qruplar: Azərbaycan / Dünya.
// • value — seçilmiş şəhərin id-si; onSelect(id) — seçim (ekran özü yazır:
//   setPrayerCity və ya bildiriş ayarları).
// ═══════════════════════════════════════════════════════

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, SectionList, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius } from '../theme/colors';
import AppIcon from './Icon';
import { PRAYER_CITIES, COUNTRY_NAMES, searchCities, cityById } from '../services/prayerLocation';
import { tr } from '../config/brand';

const TXT = {
  az: { title: 'Şəhər seçin', placeholder: 'Şəhər axtarın…', close: 'Bağla', world: 'Dünya', none: 'Siyahıda tapılmadı', change: 'Şəhəri dəyiş' },
  en: { title: 'Choose a city', placeholder: 'Search for a city…', close: 'Close', world: 'World', none: 'Not in the list', change: 'Change city' },
  ru: { title: 'Выберите город', placeholder: 'Поиск города…', close: 'Закрыть', world: 'Мир', none: 'В списке нет', change: 'Сменить город' },
  ar: { title: 'اختر المدينة', placeholder: 'ابحث عن مدينة…', close: 'إغلاق', world: 'العالم', none: 'غير موجودة في القائمة', change: 'تغيير المدينة' },
  tr: { title: 'Şehir seçin', placeholder: 'Şehir arayın…', close: 'Kapat', world: 'Dünya', none: 'Listede bulunamadı', change: 'Şehri değiştir' },
};

export default function CityPicker({ value, onSelect, lang = 'az', dark = false, style }) {
  const c = dark ? Colors.dark : Colors.light;
  const t = TXT[lang] || TXT.en;
  const isRtl = lang === 'ar';
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const current = cityById(value);
  const name = current ? tr(current.label, lang) : '';
  const country = current && current.country !== 'AZ' ? tr(COUNTRY_NAMES[current.country], lang) : '';

  const sections = useMemo(() => {
    const list = query.trim() ? searchCities(query) : PRAYER_CITIES;
    const az = list.filter(x => x.country === 'AZ');
    const ww = list.filter(x => x.country !== 'AZ');
    const out = [];
    if (az.length) out.push({ key: 'az', title: tr(COUNTRY_NAMES.AZ, lang), data: az });
    if (ww.length) out.push({ key: 'world', title: t.world, data: ww });
    return out;
  }, [query, lang, t.world]);

  const close = () => { setOpen(false); setQuery(''); };
  const pick = (id) => {
    try { Haptics.selectionAsync(); } catch { /* */ }
    close();
    if (id !== value) onSelect?.(id);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: c.card, borderColor: c.cardBorder }, style]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${t.change}: ${name}`}
      >
        <AppIcon name="location" size={18} color={c.primary} />
        <View style={styles.triggerText}>
          <Text style={[styles.triggerName, { color: c.text }]} numberOfLines={1}>{name || t.title}</Text>
          {!!country && <Text style={[styles.triggerSub, { color: c.textMuted }]} numberOfLines={1}>{country}</Text>}
        </View>
        <AppIcon name="chevronDown" size={18} color={c.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
        <View style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={t.close} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.sheet, { backgroundColor: c.background }]}>
            <View style={[styles.grip, { backgroundColor: c.cardBorder }]} />
            <View style={styles.head}>
              <Text style={[styles.title, { color: c.text }]} accessibilityRole="header">{t.title}</Text>
              <TouchableOpacity onPress={close} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel={t.close}>
                <AppIcon name="close" size={22} color={c.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={[styles.search, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <AppIcon name="search" size={18} color={c.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t.placeholder}
                placeholderTextColor={c.textMuted}
                style={[styles.input, { color: c.text, textAlign: isRtl ? 'right' : 'left' }]}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                autoFocus
                onSubmitEditing={() => { const first = sections[0]?.data[0]; if (first) pick(first.id); }}
                accessibilityLabel={t.placeholder}
              />
            </View>
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              stickySectionHeadersEnabled
              initialNumToRender={24}
              renderSectionHeader={({ section }) => (
                <Text style={[styles.groupLabel, { color: c.textMuted, backgroundColor: c.background }]}>{section.title}</Text>
              )}
              renderItem={({ item }) => {
                const active = item.id === value;
                return (
                  <TouchableOpacity
                    style={[styles.row, active && { backgroundColor: dark ? 'rgba(46,204,113,0.12)' : 'rgba(26,107,58,0.08)' }]}
                    onPress={() => pick(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <View style={styles.rowText}>
                      <Text style={[styles.rowName, { color: active ? c.primary : c.text, fontWeight: active ? '700' : '500' }]}>{tr(item.label, lang)}</Text>
                      {item.country !== 'AZ' && <Text style={[styles.rowSub, { color: c.textMuted }]}>{tr(COUNTRY_NAMES[item.country], lang)}</Text>}
                    </View>
                    {active && <AppIcon name="check" size={18} color={c.primary} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={[styles.empty, { color: c.textMuted }]}>{t.none}</Text>}
              contentContainerStyle={styles.listPad}
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 14, paddingVertical: 10, borderRadius: BorderRadius.lg || 14, borderWidth: 1 },
  triggerText: { flex: 1, minWidth: 0 },
  triggerName: { fontSize: 16, fontWeight: '600' },
  triggerSub: { fontSize: 12, marginTop: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,16,14,0.45)' },
  sheet: { height: '86%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, overflow: 'hidden' },
  grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 6 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 6 },
  title: { fontSize: 19, fontWeight: '700' },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  input: { flex: 1, minHeight: 46, fontSize: 16 },
  groupLabel: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingHorizontal: 18, paddingVertical: 10, marginHorizontal: 6, borderRadius: 10 },
  rowText: { flex: 1 },
  rowName: { fontSize: 16 },
  rowSub: { fontSize: 12, marginTop: 1 },
  empty: { textAlign: 'center', padding: 24, fontSize: 14 },
  listPad: { paddingBottom: 32 },
});
