import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, Linking, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { VIDEOS, VIDEO_CATEGORIES, getThumbnail, getVideoUrl } from '../data/videos';
import AppIcon from './Icon';
import { FadeUp, ScaleIn, PressableCard, Pulse } from './Animated';

const { width: SW } = Dimensions.get('window');

const LABELS = {
  az: { title:'Video Kontent', sub:'Mühazirələr, tilavətlər və daha çox', open:'Aç', play:'Oynat', close:'Bağla' },
  en: { title:'Video Content', sub:'Lectures, recitations and more', open:'Open', play:'Play', close:'Close' },
  ru: { title:'Видео', sub:'Лекции, чтения и больше', open:'Открыть', play:'Играть', close:'Закрыть' },
  ar: { title:'الفيديوهات', sub:'محاضرات وتلاوات والمزيد', open:'فتح', play:'تشغيل', close:'إغلاق' },
  tr: { title:'Video İçerik', sub:'Konferanslar ve daha fazlası', open:'Aç', play:'Oynat', close:'Kapat' },
};

export default function VideoSection() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shS = dark ? Shadows.dark.sm : Shadows.sm;

  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState(null);

  const filtered = selectedCat === 'all'
    ? VIDEOS
    : VIDEOS.filter(v => v.category === selectedCat);

  const openVideo = (video) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedVideo(video);
  };

  const playOnYouTube = (video) => {
    Linking.openURL(getVideoUrl(video.youtubeId));
  };

  return (
    <View style={styles.section}>
      <FadeUp>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: c.primaryBg }]}>
            <AppIcon name="play" size={20} color={c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: c.text }]}>📹 {l.title}</Text>
            <Text style={[styles.sub, { color: c.textSecondary }]}>{l.sub}</Text>
          </View>
        </View>
      </FadeUp>

      {/* Categories */}
      <FadeUp delay={100}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {VIDEO_CATEGORIES.map(cat => {
            const active = selectedCat === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.catBtn,
                  {
                    backgroundColor: active ? cat.color : c.card,
                    borderColor: active ? cat.color : c.cardBorder,
                  },
                  active && Shadows.button,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCat(cat.key);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.catText, { color: active ? '#fff' : c.textSecondary }]}>
                  {cat.label[lang] || cat.label.en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </FadeUp>

      {/* Video cards horizontal scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videosRow}>
        {filtered.map((v, i) => {
          const cat = VIDEO_CATEGORIES.find(cc => cc.key === v.category);
          return (
            <FadeUp key={v.id} delay={150 + i * 60}>
              <PressableCard
                style={[styles.videoCard, { backgroundColor: c.card, borderColor: c.cardBorder }, sh]}
                onPress={() => openVideo(v)}
              >
                <View style={styles.thumbWrap}>
                  <Image
                    source={{ uri: getThumbnail(v.youtubeId) }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                  {/* Dark gradient overlay */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0.4 }}
                    end={{ x: 0, y: 1 }}
                  />
                  {/* Play button */}
                  <Pulse>
                    <View style={[styles.playBtn, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                      <Text style={[styles.playIcon, { color: cat?.color || c.primary }]}>▶</Text>
                    </View>
                  </Pulse>
                  {/* Category badge */}
                  <View style={[styles.catBadge, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                    <Text style={[styles.catBadgeText, { color: cat?.color }]}>
                      {cat?.label[lang] || cat?.label.en}
                    </Text>
                  </View>
                  {/* Duration */}
                  {v.duration && (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{v.duration}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.body}>
                  <Text style={[styles.videoTitle, { color: c.text }]} numberOfLines={2}>
                    {v.title[lang] || v.title.en}
                  </Text>
                  {(v.description?.[lang] || v.description?.en) && (
                    <Text style={[styles.videoDesc, { color: c.textMuted }]} numberOfLines={2}>
                      {v.description[lang] || v.description.en}
                    </Text>
                  )}
                </View>
              </PressableCard>
            </FadeUp>
          );
        })}
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={!!selectedVideo}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedVideo(null)}
      >
        {selectedVideo && (
          <View style={styles.modalWrap}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              onPress={() => setSelectedVideo(null)}
              activeOpacity={1}
            />
            <ScaleIn>
              <View style={[styles.modalCard, { backgroundColor: c.background }]}>
                {/* Handle */}
                <View style={[styles.modalHandle, { backgroundColor: c.border }]} />

                <Image
                  source={{ uri: getThumbnail(selectedVideo.youtubeId) }}
                  style={styles.modalThumb}
                  resizeMode="cover"
                />

                <View style={styles.modalBody}>
                  <Text style={[styles.modalTitle, { color: c.text }]}>
                    {selectedVideo.title[lang] || selectedVideo.title.en}
                  </Text>
                  {(selectedVideo.description?.[lang] || selectedVideo.description?.en) && (
                    <Text style={[styles.modalDesc, { color: c.textSecondary }]}>
                      {selectedVideo.description[lang] || selectedVideo.description.en}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[styles.playYTBtn, Shadows.button]}
                    onPress={() => playOnYouTube(selectedVideo)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.playYTGrad}>
                      <AppIcon name="play" size={20} color="#fff" />
                      <Text style={styles.playYTText}>{l.play} on YouTube</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.closeBtn, { backgroundColor: c.card, borderColor: c.cardBorder }]}
                    onPress={() => setSelectedVideo(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.closeBtnText, { color: c.text }]}>{l.close}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScaleIn>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 36 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  sub: { fontSize: 13, marginTop: 2 },

  // Categories
  catRow: { gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
  catText: { fontSize: 12, fontWeight: '700' },

  // Videos row
  videosRow: { gap: 14, paddingHorizontal: 20, paddingBottom: 8 },
  videoCard: {
    width: SW * 0.78,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbWrap: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
    position: 'relative',
  },
  thumb: { width: '100%', height: '100%' },
  playBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    marginLeft: -28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  playIcon: { fontSize: 22, fontWeight: '800', marginLeft: 3 },
  catBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  catBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  body: { padding: 14 },
  videoTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4, letterSpacing: -0.2, lineHeight: 20 },
  videoDesc: { fontSize: 12, lineHeight: 18 },

  // Modal
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  modalThumb: { width: '100%', aspectRatio: 16/9 },
  modalBody: { padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  modalDesc: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  playYTBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: 12 },
  playYTGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  playYTText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  closeBtn: { paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center' },
  closeBtnText: { fontWeight: '700', fontSize: 14 },
});
