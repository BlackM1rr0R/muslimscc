import React, { useState, useMemo, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  TextInput, Modal, Linking, Share, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useLang } from '../contexts/LangContext'
import { Colors } from '../theme/colors'
import { VIDEOS, VIDEO_CATEGORIES, getThumbnail, getVideoUrl, subscribeToVideos } from '../data/videos'
import PageHero from '../components/PageHero'
import Pagination from '../components/Pagination'

const { width: SW } = Dimensions.get('window')

const LABELS = {
  az: { title:'Video Kitabxana', subtitle:'İslami mühazirələr, Quran tilavətləri', search:'Video axtar...', allVideos:'Bütün videolar', noResults:'Video tapılmadı', videos:'video', play:'Oynat', watch:'YouTube-da bax', share:'Paylaş' },
  en: { title:'Video Library', subtitle:'Islamic lectures, Quran recitations', search:'Search videos...', allVideos:'All videos', noResults:'No videos found', videos:'videos', play:'Play', watch:'Watch on YouTube', share:'Share' },
  ru: { title:'Видео Библиотека', subtitle:'Исламские лекции, чтение Корана', search:'Поиск видео...', allVideos:'Все видео', noResults:'Видео не найдены', videos:'видео', play:'Играть', watch:'Смотреть на YouTube', share:'Поделиться' },
  ar: { title:'مكتبة الفيديو', subtitle:'محاضرات إسلامية وتلاوات قرآنية', search:'البحث عن فيديو...', allVideos:'كل الفيديوهات', noResults:'لا توجد فيديوهات', videos:'فيديو', play:'تشغيل', watch:'شاهد على YouTube', share:'مشاركة' },
  tr: { title:'Video Kütüphanesi', subtitle:'İslami konferanslar, Kuran tilavetleri', search:'Video ara...', allVideos:'Tüm videolar', noResults:'Video bulunamadı', videos:'video', play:'Oynat', watch:'YouTube\'da izle', share:'Paylaş' },
}

const PER_PAGE = 8

export default function VideosScreen() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [videos, setVideos] = useState(VIDEOS)
  const [selectedCat, setSelectedCat] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [pageNum, setPageNum] = useState(1)

  useEffect(() => {
    const unsubscribe = subscribeToVideos((items) => setVideos(items))
    return () => unsubscribe?.()
  }, [])

  const filtered = useMemo(() => {
    let list = videos
    if (selectedCat !== 'all') list = list.filter(v => v.category === selectedCat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(v => {
        const title = (v.title?.[lang] || v.title?.en || '').toLowerCase()
        const desc = (v.description?.[lang] || v.description?.en || '').toLowerCase()
        return title.includes(q) || desc.includes(q)
      })
    }
    return list
  }, [videos, selectedCat, search, lang])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(pageNum, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  // Reset page on filter change
  React.useEffect(() => { setPageNum(1) }, [selectedCat, search])

  const handleShare = async (v) => {
    const title = v.title?.[lang] || v.title?.en
    try {
      await Share.share({
        message: `${title}\n${getVideoUrl(v.youtubeId)}`,
        title,
      })
    } catch {}
  }

  const handleWatch = (v) => {
    Linking.openURL(getVideoUrl(v.youtubeId)).catch(() => {})
  }

  return (
    <ScrollView style={{ flex:1, backgroundColor: Colors.bg }} showsVerticalScrollIndicator={false}>
      <PageHero
        title={l.title}
        subtitle={l.subtitle}
        arabic="مَكْتَبَةُ الفِيدِيُو"
        gradient={['#10b981', '#059669', '#047857']}
        icon="📹"
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

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {VIDEO_CATEGORIES.map(cat => {
            const active = selectedCat === cat.key
            const count = cat.key === 'all' ? videos.length : videos.filter(v => v.category === cat.key).length
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => { Haptics.selectionAsync(); setSelectedCat(cat.key) }}
                style={[styles.catBtn, active && { backgroundColor: cat.color, borderColor: cat.color }]}
              >
                <Text style={[styles.catBtnText, active && { color:'#fff' }]}>
                  {cat.label?.[lang] || cat.label?.en || cat.key}
                </Text>
                <View style={[styles.catCount, active && { backgroundColor:'rgba(255,255,255,0.3)' }]}>
                  <Text style={[styles.catCountText, active && { color:'#fff' }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>
          🎬 {selectedCat === 'all' ? l.allVideos : VIDEO_CATEGORIES.find(c => c.key === selectedCat)?.label?.[lang]} ({filtered.length})
        </Text>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📹</Text>
            <Text style={styles.emptyText}>{l.noResults}</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {paginated.map(v => {
              const cat = VIDEO_CATEGORIES.find(c => c.key === v.category)
              return (
                <TouchableOpacity
                  key={v.id}
                  style={styles.card}
                  onPress={() => { Haptics.selectionAsync(); setSelectedVideo(v) }}
                  activeOpacity={0.85}
                >
                  <View style={styles.thumb}>
                    <Image source={{ uri: getThumbnail(v.youtubeId) }} style={StyleSheet.absoluteFill} />
                    <View style={styles.playBtn}>
                      <Text style={{ color:'#fff', fontSize: 28 }}>▶</Text>
                    </View>
                    {cat ? (
                      <View style={[styles.catBadge, { backgroundColor: cat.color }]}>
                        <Text style={styles.catBadgeText}>{cat.label?.[lang] || cat.label?.en}</Text>
                      </View>
                    ) : null}
                    {v.duration && v.duration !== '—' ? (
                      <View style={styles.duration}>
                        <Text style={styles.durationText}>{v.duration}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{v.title?.[lang] || v.title?.en}</Text>
                    {(v.description?.[lang] || v.description?.en) ? (
                      <Text style={styles.cardDesc} numberOfLines={2}>{v.description[lang] || v.description.en}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        <Pagination current={currentPage} total={totalPages} onChange={setPageNum} color="#10b981" />
      </View>

      {/* Video details modal */}
      <Modal
        visible={!!selectedVideo}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedVideo(null)}
      >
        {selectedVideo ? (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSelectedVideo(null)} />
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedVideo(null)}>
                <Text style={{ fontSize: 18, color:'#fff' }}>✕</Text>
              </TouchableOpacity>
              <View style={styles.modalThumbWrap}>
                <Image source={{ uri: getThumbnail(selectedVideo.youtubeId) }} style={styles.modalThumb} />
              </View>
              <View style={{ padding: 20 }}>
                <Text style={styles.modalTitle}>{selectedVideo.title?.[lang] || selectedVideo.title?.en}</Text>
                {(selectedVideo.description?.[lang] || selectedVideo.description?.en) ? (
                  <Text style={styles.modalDesc}>{selectedVideo.description[lang] || selectedVideo.description.en}</Text>
                ) : null}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalBtn} onPress={() => handleWatch(selectedVideo)}>
                    <LinearGradient colors={['#10b981','#059669']} style={styles.modalBtnGrad}>
                      <Text style={styles.modalBtnText}>▶ {l.watch}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalShareBtn} onPress={() => handleShare(selectedVideo)}>
                    <Text style={styles.modalShareText}>📤</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard || '#fff',
    borderWidth: 2, borderColor: Colors.border || '#e2e8df',
    borderRadius: 999, paddingHorizontal: 18, height: 48,
    marginBottom: 12, gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text || '#1a2e1e' },
  searchClear: { fontSize: 14, color: Colors.textMuted || '#7a9b82' },

  catScroll: { marginHorizontal: -16, marginBottom: 14 },
  catBtn: {
    backgroundColor: Colors.bgCard || '#fff',
    borderWidth: 2, borderColor: Colors.border || '#e2e8df',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  catBtnText: { fontSize: 13, fontWeight: '700', color: Colors.text || '#1a2e1e' },
  catCount: { backgroundColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  catCountText: { fontSize: 11, fontWeight: '800', color: Colors.textMuted || '#7a9b82' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.text || '#1a2e1e', marginVertical: 12 },

  card: {
    backgroundColor: Colors.bgCard || '#fff',
    borderWidth: 1, borderColor: Colors.border || '#e2e8df',
    borderRadius: 16, overflow: 'hidden',
  },
  thumb: {
    width: '100%', aspectRatio: 16/9,
    backgroundColor: '#000', position: 'relative',
  },
  playBtn: {
    position: 'absolute', top: '50%', left: '50%',
    marginLeft: -28, marginTop: -28,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  catBadge: {
    position: 'absolute', top: 10, left: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  catBadgeText: { color:'#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  duration: {
    position: 'absolute', bottom: 10, right: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 6,
  },
  durationText: { color:'#fff', fontSize: 12, fontWeight: '700' },

  cardBody: { padding: 14, gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text || '#1a2e1e', lineHeight: 20 },
  cardDesc: { fontSize: 13, color: Colors.textMuted || '#7a9b82', lineHeight: 18 },

  empty: { padding: 60, alignItems: 'center', gap: 12 },
  emptyIcon: { fontSize: 56, opacity: 0.5 },
  emptyText: { color: Colors.textMuted || '#7a9b82', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: Colors.bgCard || '#fff', borderRadius: 20, width: '100%', overflow: 'hidden' },
  modalClose: {
    position: 'absolute', top: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  modalThumbWrap: { width: '100%', aspectRatio: 16/9, backgroundColor: '#000' },
  modalThumb: { width: '100%', height: '100%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text || '#1a2e1e', marginBottom: 8 },
  modalDesc: { fontSize: 14, lineHeight: 21, color: Colors.textMuted || '#7a9b82', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 999, overflow: 'hidden' },
  modalBtnGrad: { paddingVertical: 12, alignItems: 'center' },
  modalBtnText: { color:'#fff', fontWeight: '800', fontSize: 14 },
  modalShareBtn: {
    paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: Colors.bgSoft || '#f8fafc',
    borderWidth: 2, borderColor: Colors.border || '#e2e8df',
    borderRadius: 999,
  },
  modalShareText: { fontSize: 16 },
})
