import React, { useState, useMemo, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
  TextInput, Modal, Linking, Alert, Dimensions, Share,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useLang } from '../contexts/LangContext'
import { Colors, BorderRadius, Shadows } from '../theme/colors'
import { DEFAULT_BOOKS, BOOK_CATEGORIES, subscribeToBooks } from '../data/books'
import PageHero from '../components/PageHero'
import AppIcon from '../components/Icon'

const { width: SW } = Dimensions.get('window')

const LABELS = {
  az: { title:'Kitabxana', subtitle:'İslami kitablar və alimlərin əsərləri', search:'Kitab axtar...', all:'Hamısı', featured:'Seçilmiş Kitablar', allBooks:'Bütün Kitablar', noResults:'Kitab tapılmadı', loading:'Yüklənir...', books:'kitab', author:'Müəllif', read:'Oxu', readPdf:'PDF açın', noPdf:'PDF mövcud deyil', pages:'səhifə', year:'İl', share:'Paylaş', close:'Bağla' },
  en: { title:'Library', subtitle:'Islamic books and scholarly works', search:'Search books...', all:'All', featured:'Featured Books', allBooks:'All Books', noResults:'No books found', loading:'Loading...', books:'books', author:'Author', read:'Read', readPdf:'Open PDF', noPdf:'PDF not available', pages:'pages', year:'Year', share:'Share', close:'Close' },
  ru: { title:'Библиотека', subtitle:'Исламские книги и научные труды', search:'Поиск книг...', all:'Все', featured:'Избранные книги', allBooks:'Все книги', noResults:'Книги не найдены', loading:'Загрузка...', books:'книг', author:'Автор', read:'Читать', readPdf:'Открыть PDF', noPdf:'PDF недоступен', pages:'страниц', year:'Год', share:'Поделиться', close:'Закрыть' },
  ar: { title:'المكتبة', subtitle:'كتب إسلامية وأعمال علمية', search:'البحث عن كتاب...', all:'الكل', featured:'كتب مميزة', allBooks:'كل الكتب', noResults:'لا توجد كتب', loading:'جارٍ التحميل...', books:'كتاب', author:'المؤلف', read:'اقرأ', readPdf:'فتح PDF', noPdf:'PDF غير متاح', pages:'صفحة', year:'السنة', share:'مشاركة', close:'إغلاق' },
  tr: { title:'Kütüphane', subtitle:'İslami kitaplar ve âlim eserleri', search:'Kitap ara...', all:'Tümü', featured:'Öne Çıkan Kitaplar', allBooks:'Tüm Kitaplar', noResults:'Kitap bulunamadı', loading:'Yükleniyor...', books:'kitap', author:'Yazar', read:'Oku', readPdf:'PDF aç', noPdf:'PDF mevcut değil', pages:'sayfa', year:'Yıl', share:'Paylaş', close:'Kapat' },
}

export default function BooksScreen() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [books, setBooks] = useState(DEFAULT_BOOKS)
  const [selectedCat, setSelectedCat] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)

  // Real-time Firebase — admin əlavə edəndə dərhal görünür
  useEffect(() => {
    const unsubscribe = subscribeToBooks((items) => setBooks(items))
    return () => unsubscribe?.()
  }, [])

  const filtered = useMemo(() => {
    let list = books
    if (selectedCat !== 'all') list = list.filter(b => b.category === selectedCat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(b => {
        const title = (b.title?.[lang] || b.title?.en || '').toLowerCase()
        const author = (b.author?.[lang] || b.author?.en || '').toLowerCase()
        return title.includes(q) || author.includes(q)
      })
    }
    return list
  }, [books, selectedCat, search, lang])

  const handleShare = async (b) => {
    const title = b.title?.[lang] || b.title?.en
    const author = b.author?.[lang] || b.author?.en
    try {
      await Share.share({
        message: `📚 ${title} — ${author}${b.pdfUrl ? '\n' + b.pdfUrl : ''}`,
        title,
      })
    } catch {}
  }

  const handleReadPdf = (b) => {
    if (!b.pdfUrl) {
      Alert.alert(l.noPdf)
      return
    }
    Linking.openURL(b.pdfUrl).catch(() => Alert.alert(l.noPdf))
  }

  const renderCover = (b, size = 'normal') => {
    const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
    const color = cat?.color || '#f59e0b'
    return (
      <LinearGradient
        colors={[color, color + 'dd']}
        style={size === 'large' ? styles.coverLarge : styles.cover}
      >
        <Text style={size === 'large' ? styles.coverIconLarge : styles.coverIcon}>📖</Text>
        <Text style={styles.coverCat}>{cat?.label[lang] || cat?.label.en}</Text>
        {b.pdfUrl ? (
          <View style={styles.pdfBadge}>
            <Text style={styles.pdfBadgeText}>📄 PDF</Text>
          </View>
        ) : null}
      </LinearGradient>
    )
  }

  return (
    <ScrollView style={{ flex:1, backgroundColor: Colors.bg }} showsVerticalScrollIndicator={false}>
      <PageHero
        title={l.title}
        subtitle={l.subtitle}
        arabic="مَكْتَبَةُ الْكُتُبِ"
        gradient={['#f59e0b', '#d97706', '#b45309']}
        icon="📚"
      />

      <View style={styles.content}>
        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={l.search}
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {BOOK_CATEGORIES.map(cat => {
            const active = selectedCat === cat.key
            const count = cat.key === 'all' ? books.length : books.filter(b => b.category === cat.key).length
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => { Haptics.selectionAsync(); setSelectedCat(cat.key) }}
                style={[styles.catBtn, active && { backgroundColor: cat.color, borderColor: cat.color }]}
              >
                <Text style={[styles.catBtnText, active && { color:'#fff' }]}>
                  {cat.label[lang] || cat.label.en}
                </Text>
                <View style={[styles.catCount, active && { backgroundColor:'rgba(255,255,255,0.3)' }]}>
                  <Text style={[styles.catCountText, active && { color:'#fff' }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Section title */}
        <Text style={styles.sectionTitle}>📖 {selectedCat === 'all' ? l.allBooks : BOOK_CATEGORIES.find(c => c.key === selectedCat)?.label[lang]}  ({filtered.length})</Text>

        {/* Grid */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>{l.noResults}</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map(b => (
              <TouchableOpacity
                key={b.id}
                onPress={() => { Haptics.selectionAsync(); setSelectedBook(b) }}
                style={styles.card}
                activeOpacity={0.85}
              >
                {renderCover(b)}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{b.title?.[lang] || b.title?.en}</Text>
                  <Text style={styles.cardAuthor} numberOfLines={1}>✍️ {b.author?.[lang] || b.author?.en}</Text>
                  {(b.pages || b.year) ? (
                    <View style={styles.cardMeta}>
                      {b.pages ? <Text style={styles.cardMetaText}>📄 {b.pages}</Text> : null}
                      {b.year ? <Text style={styles.cardMetaText}>📅 {b.year}</Text> : null}
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Book details modal */}
      <Modal
        visible={!!selectedBook}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBook(null)}
      >
        {selectedBook ? (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSelectedBook(null)} />
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedBook(null)}>
                <Text style={{ fontSize: 18, color:'#fff' }}>✕</Text>
              </TouchableOpacity>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                {renderCover(selectedBook, 'large')}
                <Text style={styles.modalTitle}>{selectedBook.title?.[lang] || selectedBook.title?.en}</Text>
                <Text style={styles.modalAuthor}>✍️ {selectedBook.author?.[lang] || selectedBook.author?.en}</Text>
                <View style={styles.modalMeta}>
                  {selectedBook.pages ? <Text style={styles.modalMetaPill}>📄 {selectedBook.pages} {l.pages}</Text> : null}
                  {selectedBook.year ? <Text style={styles.modalMetaPill}>📅 {selectedBook.year}</Text> : null}
                </View>
                {(selectedBook.description?.[lang] || selectedBook.description?.en) ? (
                  <Text style={styles.modalDesc}>{selectedBook.description[lang] || selectedBook.description.en}</Text>
                ) : null}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, !selectedBook.pdfUrl && { opacity: 0.5 }]}
                    onPress={() => handleReadPdf(selectedBook)}
                    disabled={!selectedBook.pdfUrl}
                  >
                    <LinearGradient colors={['#f59e0b','#d97706']} style={styles.modalBtnGrad}>
                      <Text style={styles.modalBtnText}>📖 {selectedBook.pdfUrl ? l.readPdf : l.noPdf}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalShareBtn} onPress={() => handleShare(selectedBook)}>
                    <Text style={styles.modalShareText}>📤 {l.share}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        ) : null}
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard || '#fff',
    borderWidth: 2,
    borderColor: Colors.border || '#e2e8df',
    borderRadius: 999,
    paddingHorizontal: 18,
    height: 48,
    marginBottom: 12,
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text || '#1a2e1e' },
  searchClear: { fontSize: 14, color: Colors.textMuted || '#7a9b82' },

  catScroll: { marginHorizontal: -16, marginBottom: 14 },
  catBtn: {
    backgroundColor: Colors.bgCard || '#fff',
    borderWidth: 2,
    borderColor: Colors.border || '#e2e8df',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catBtnText: { fontSize: 13, fontWeight: '700', color: Colors.text || '#1a2e1e' },
  catCount: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  catCountText: { fontSize: 11, fontWeight: '800', color: Colors.textMuted || '#7a9b82' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.text || '#1a2e1e', marginVertical: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: (SW - 16 * 2 - 12) / 2,
    backgroundColor: Colors.bgCard || '#fff',
    borderWidth: 1,
    borderColor: Colors.border || '#e2e8df',
    borderRadius: 14,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    aspectRatio: 2/3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  coverLarge: {
    width: 180,
    aspectRatio: 2/3,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  coverIcon: { fontSize: 48 },
  coverIconLarge: { fontSize: 72 },
  coverCat: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
    textAlign: 'center',
    opacity: 0.95,
  },
  pdfBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pdfBadgeText: { color:'#fff', fontSize: 10, fontWeight: '800' },

  cardBody: { padding: 12, gap: 4 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: Colors.text || '#1a2e1e', lineHeight: 17 },
  cardAuthor: { fontSize: 11.5, color: Colors.textMuted || '#7a9b82', fontWeight: '600' },
  cardMeta: { flexDirection: 'row', gap: 10, marginTop: 2 },
  cardMetaText: { fontSize: 10.5, color: Colors.textMuted || '#7a9b82', fontWeight: '700' },

  empty: { padding: 60, alignItems: 'center', gap: 12 },
  emptyIcon: { fontSize: 56, opacity: 0.5 },
  emptyText: { color: Colors.textMuted || '#7a9b82', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: Colors.bgCard || '#fff', borderRadius: 20, width: '100%', maxHeight: '85%' },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: Colors.text || '#1a2e1e', marginBottom: 6, textAlign: 'center' },
  modalAuthor: { fontSize: 15, color: Colors.textMuted || '#7a9b82', fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  modalMeta: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
  modalMetaPill: {
    backgroundColor: Colors.bgSoft || '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.text || '#1a2e1e',
  },
  modalDesc: { fontSize: 14.5, lineHeight: 22, color: Colors.text || '#1a2e1e', marginBottom: 18 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 999, overflow: 'hidden' },
  modalBtnGrad: { paddingVertical: 12, alignItems: 'center' },
  modalBtnText: { color:'#fff', fontWeight: '800', fontSize: 14 },
  modalShareBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: Colors.bgSoft || '#f8fafc',
    borderWidth: 2,
    borderColor: Colors.border || '#e2e8df',
    borderRadius: 999,
  },
  modalShareText: { fontWeight: '800', fontSize: 13, color: Colors.text || '#1a2e1e' },
})
