import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useNavigation } from '@react-navigation/native'
import { useLang } from '../contexts/LangContext'
import { Colors } from '../theme/colors'
import { DEFAULT_BOOKS, BOOK_CATEGORIES, subscribeToBooks } from '../data/books'
import { FadeUp } from './Animated'
import Pagination from './Pagination'

const { width: SW } = Dimensions.get('window')
const CARD_W = (SW - 16 * 2 - 12) / 2 // 2 sütun, 16 margin, 12 gap

const LABELS = {
  az: { title:'Kitabxana', sub:'İslami kitablar və alimlərin əsərləri', viewAll:'Hamısını gör' },
  en: { title:'Library', sub:'Islamic books and scholarly works', viewAll:'View all' },
  ru: { title:'Библиотека', sub:'Исламские книги и научные труды', viewAll:'Все книги' },
  ar: { title:'المكتبة', sub:'الكتب الإسلامية وأعمال العلماء', viewAll:'عرض الكل' },
  tr: { title:'Kütüphane', sub:'İslami kitaplar ve âlim eserleri', viewAll:'Tümünü gör' },
}

const PER_PAGE = 4 // mobile-da bir səhifədə 4 kitab göstər (2x2)

export default function BookSection() {
  const navigation = useNavigation()
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [books, setBooks] = useState(DEFAULT_BOOKS)
  const [pageNum, setPageNum] = useState(1)

  useEffect(() => {
    const unsubscribe = subscribeToBooks((items) => setBooks(items))
    return () => unsubscribe?.()
  }, [])

  const totalPages = Math.max(1, Math.ceil(books.length / PER_PAGE))
  const currentPage = Math.min(pageNum, totalPages)
  const preview = books.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const goToBooks = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigation.navigate('Books')
  }

  return (
    <View style={styles.section}>
      <FadeUp>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>📚 {l.title}</Text>
            <Text style={styles.sub}>{l.sub}</Text>
          </View>
          <TouchableOpacity onPress={goToBooks}>
            <LinearGradient colors={['#f59e0b','#d97706']} style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>{l.viewAll} →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </FadeUp>

      <View style={styles.grid}>
        {preview.map(b => {
          const cat = BOOK_CATEGORIES.find(c => c.key === b.category)
          const color = cat?.color || '#f59e0b'
          return (
            <TouchableOpacity
              key={b.id}
              style={styles.card}
              onPress={goToBooks}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[color, color + 'dd']} style={styles.cover}>
                <Text style={styles.coverIcon}>📖</Text>
                <Text style={styles.coverCat}>{cat?.label[lang] || cat?.label.en}</Text>
                {b.pdfUrl ? (
                  <View style={styles.pdfBadge}>
                    <Text style={styles.pdfBadgeText}>📄 PDF</Text>
                  </View>
                ) : null}
              </LinearGradient>
              <View style={styles.body}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {b.title?.[lang] || b.title?.en}
                </Text>
                <Text style={styles.cardAuthor} numberOfLines={1}>
                  ✍️ {b.author?.[lang] || b.author?.en}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      <Pagination
        current={currentPage}
        total={totalPages}
        onChange={setPageNum}
        color="#f59e0b"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
    backgroundColor: Colors.bg || '#f7f8f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text || '#1a2e1e' },
  sub: { fontSize: 13, color: Colors.textMuted || '#7a9b82', marginTop: 2 },
  viewAllBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  viewAllText: { color:'#fff', fontWeight:'800', fontSize: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: CARD_W,
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
  coverIcon: { fontSize: 48 },
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

  body: { padding: 10, gap: 4 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: Colors.text || '#1a2e1e', lineHeight: 17 },
  cardAuthor: { fontSize: 11, color: Colors.textMuted || '#7a9b82', fontWeight: '600' },
})
