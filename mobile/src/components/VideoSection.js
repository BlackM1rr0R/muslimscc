import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, Dimensions, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { VIDEOS, VIDEO_CATEGORIES, getThumbnail, subscribeToVideos } from '../data/videos';
import AppIcon from './Icon';
import { FadeUp, PressableCard, Pulse } from './Animated';

// WebView yalnız ios/android-də mövcuddur. Web-də iframe istifadə edirik.
let WebView = null;
if (Platform.OS !== 'web') {
  try { WebView = require('react-native-webview').WebView; } catch {}
}

// Platform-uyğun YouTube pleyer
function YouTubePlayer({ videoId, loadingText }) {
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;

  if (Platform.OS === 'web') {
    return React.createElement('iframe', {
      src,
      style: { width: '100%', height: '100%', border: 0, backgroundColor: '#000' },
      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
      allowFullScreen: true,
    });
  }

  if (!WebView) {
    return (
      <View style={styles.playerLoading}>
        <Text style={styles.playerLoadingText}>WebView unavailable</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: src }}
      style={{ flex: 1, backgroundColor: '#000' }}
      allowsFullscreenVideo
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      renderLoading={() => (
        <View style={styles.playerLoading}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.playerLoadingText}>{loadingText}</Text>
        </View>
      )}
    />
  );
}

const { width: SW } = Dimensions.get('window');

const LABELS = {
  az: { title:'Video Kontent', sub:'Mühazirələr, tilavətlər və daha çox', close:'Bağla', loadingPlayer:'Pleyer yüklənir...' },
  en: { title:'Video Content', sub:'Lectures, recitations and more', close:'Close', loadingPlayer:'Loading player...' },
  ru: { title:'Видео', sub:'Лекции, чтения и больше', close:'Закрыть', loadingPlayer:'Загрузка плеера...' },
  ar: { title:'الفيديوهات', sub:'محاضرات وتلاوات والمزيد', close:'إغلاق', loadingPlayer:'تحميل المشغل...' },
  tr: { title:'Video İçerik', sub:'Konferanslar ve daha fazlası', close:'Kapat', loadingPlayer:'Oynatıcı yükleniyor...' },
};

export default function VideoSection() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const sh = dark ? Shadows.dark.md : Shadows.md;
  const shS = dark ? Shadows.dark.sm : Shadows.sm;

  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time Firebase subscription — web ilə eyni mənbə.
  // Admin video əlavə edəndə ana səhifədə dərhal görünür.
  useEffect(() => {
    const unsubscribe = subscribeToVideos((items) => {
      setVideos(items.length > 0 ? items : VIDEOS);
      setLoading(false);
    });
    return () => unsubscribe?.();
  }, []);

  const filtered = selectedCat === 'all'
    ? videos
    : videos.filter(v => v.category === selectedCat);

  const openVideo = (video) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedVideo(video);
  };

  const embedUrl = (id) =>
    `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;

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
      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      ) : (
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
                  {/* Play button — perfectly centered on the thumbnail */}
                  <View pointerEvents="none" style={styles.playBtnCenter}>
                    <Pulse>
                      <View style={[styles.playBtn, { backgroundColor: 'rgba(255,255,255,0.96)' }]}>
                        <Text style={[styles.playIcon, { color: cat?.color || c.primary }]}>▶</Text>
                      </View>
                    </Pulse>
                  </View>
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
      )}

      {/* Inline player modal — YouTube embed in WebView, opens centered on screen */}
      <Modal
        visible={!!selectedVideo}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setSelectedVideo(null)}
      >
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.95)" />
        {selectedVideo && (
          <View style={styles.playerWrap}>
            <TouchableOpacity
              style={styles.playerBackdrop}
              onPress={() => setSelectedVideo(null)}
              activeOpacity={1}
            />
            <View style={styles.playerCard}>
              {/* Close button (above the player) */}
              <TouchableOpacity
                style={styles.playerClose}
                onPress={() => setSelectedVideo(null)}
                activeOpacity={0.8}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <Text style={styles.playerCloseIcon}>×</Text>
              </TouchableOpacity>

              {/* 16:9 YouTube player — WebView on native, iframe on web */}
              <View style={styles.playerVideoBox}>
                <YouTubePlayer videoId={selectedVideo.youtubeId} loadingText={l.loadingPlayer} />
              </View>

              {/* Title + description below player */}
              <View style={[styles.playerInfo, { backgroundColor: c.card }]}>
                <Text style={[styles.playerTitle, { color: c.text }]} numberOfLines={2}>
                  {selectedVideo.title[lang] || selectedVideo.title.en}
                </Text>
                {(selectedVideo.description?.[lang] || selectedVideo.description?.en) && (
                  <Text style={[styles.playerDesc, { color: c.textSecondary }]} numberOfLines={3}>
                    {selectedVideo.description[lang] || selectedVideo.description.en}
                  </Text>
                )}
              </View>
            </View>
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
  videosRow: { gap: 12, paddingHorizontal: 20, paddingBottom: 8 },
  videoCard: {
    width: SW * 0.72,
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
  playBtnCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  playIcon: { fontSize: 24, fontWeight: '800', marginLeft: 4, lineHeight: 26 },
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

  // Inline YouTube player
  playerWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  playerBackdrop: { ...StyleSheet.absoluteFillObject },
  playerCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    overflow: 'hidden',
  },
  playerClose: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  playerCloseIcon: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 28, marginTop: -2 },
  playerVideoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 14,
    overflow: 'hidden',
  },
  playerLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    gap: 10,
  },
  playerLoadingText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  playerInfo: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  playerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2, marginBottom: 6, lineHeight: 22 },
  playerDesc: { fontSize: 13, lineHeight: 19 },
});
