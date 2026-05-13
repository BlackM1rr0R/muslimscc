import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { useLang } from '../contexts/LangContext'
import { Colors } from '../theme/colors'
import {
  subscribeToAnnouncements,
  subscribeToDailyContent,
  subscribeToHero,
  ANNOUNCEMENT_TYPES,
  HERO_GRADIENTS,
} from '../data/adminContent'

// ═══════════════════════════════════════════════════════
// 1) ANNOUNCEMENT BANNER — Admin elanlarını göstərir
// ═══════════════════════════════════════════════════════
export function AnnouncementBanner() {
  const { lang } = useLang()
  const [items, setItems] = useState([])
  const [closed, setClosed] = useState([])

  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements((all) => {
      setItems((all || []).filter(a => a.active !== false))
    })
    return () => unsubscribe?.()
  }, [])

  const visible = items.filter(a => !closed.includes(a.id))
  if (visible.length === 0) return null

  const readMore = { az:'Daha çox', en:'Learn more', ru:'Подробнее', ar:'المزيد', tr:'Daha fazla' }[lang] || 'Learn more'

  return (
    <View style={styles.annContainer}>
      {visible.map(a => {
        const type = ANNOUNCEMENT_TYPES.find(t => t.key === a.type) || ANNOUNCEMENT_TYPES[0]
        return (
          <View key={a.id} style={[styles.annCard, {
            backgroundColor: type.color + '14',
            borderColor: type.color + '40',
            borderLeftColor: type.color,
          }]}>
            <Text style={styles.annIcon}>{type.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.annTitle}>{a.title?.[lang] || a.title?.en}</Text>
              {(a.message?.[lang] || a.message?.en) ? (
                <Text style={styles.annMsg}>{a.message[lang] || a.message.en}</Text>
              ) : null}
              {a.link ? (
                <TouchableOpacity onPress={() => Linking.openURL(a.link).catch(() => {})}>
                  <Text style={[styles.annLink, { color: type.color }]}>{readMore} →</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => setClosed(c => [...c, a.id])} style={styles.annClose}>
              <Text style={{ fontSize: 14, color: Colors.textMuted || '#7a9b82' }}>✕</Text>
            </TouchableOpacity>
          </View>
        )
      })}
    </View>
  )
}

// ═══════════════════════════════════════════════════════
// 2) HERO BANNER — Admin tərəfindən qurulan hero block
// ═══════════════════════════════════════════════════════
export function HeroBannerDisplay() {
  const navigation = useNavigation()
  const { lang } = useLang()
  const [hero, setHero] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToHero((data) => {
      if (data?.active) setHero(data)
      else setHero(null)
    })
    return () => unsubscribe?.()
  }, [])

  if (!hero) return null

  const gradient = HERO_GRADIENTS.find(g => g.key === hero.gradient) || HERO_GRADIENTS[0]
  const title = hero.title?.[lang] || hero.title?.en
  const subtitle = hero.subtitle?.[lang] || hero.subtitle?.en
  const ctaText = hero.ctaText?.[lang] || hero.ctaText?.en

  if (!title) return null

  const handleCta = () => {
    if (!hero.ctaLink) return
    if (hero.ctaLink.startsWith('http')) {
      Linking.openURL(hero.ctaLink).catch(() => {})
    } else {
      // Daxili route — capitalize
      const routeName = hero.ctaLink.charAt(0).toUpperCase() + hero.ctaLink.slice(1)
      try { navigation.navigate(routeName) } catch {}
    }
  }

  return (
    <LinearGradient colors={gradient.colors} style={styles.heroBanner}>
      <View style={styles.heroCircle1} />
      <View style={styles.heroCircle2} />
      <Text style={styles.heroTitle}>{title}</Text>
      {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
      {ctaText ? (
        <TouchableOpacity onPress={handleCta} style={[styles.heroCta, { shadowColor: gradient.colors[1] }]}>
          <Text style={[styles.heroCtaText, { color: gradient.colors[1] }]}>{ctaText} →</Text>
        </TouchableOpacity>
      ) : null}
    </LinearGradient>
  )
}

// ═══════════════════════════════════════════════════════
// 3) DAILY CONTENT — Günün ayəsi/zikri/sözü
// ═══════════════════════════════════════════════════════
export function DailyContentDisplay() {
  const { lang } = useLang()
  const [content, setContent] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToDailyContent((c) => {
      if (!c) { setContent(null); return }
      const hasAyah = c.ayah?.ar || c.ayah?.text?.[lang] || c.ayah?.text?.en
      const hasDhikr = c.dhikr?.ar || c.dhikr?.text?.[lang]
      const hasQuote = c.quote?.ar || c.quote?.text?.[lang] || c.quote?.text?.en
      if (hasAyah || hasDhikr || hasQuote) {
        setContent({ ...c, hasAyah, hasDhikr, hasQuote })
      } else {
        setContent(null)
      }
    })
    return () => unsubscribe?.()
  }, [lang])

  if (!content) return null

  const TITLES = {
    az: { ayah:'Günün Ayəsi', dhikr:'Günün Zikri', quote:'Günün Sözü', target:'Hədəf', section:'Bugünkü Məzmun' },
    en: { ayah:'Daily Ayah', dhikr:'Daily Dhikr', quote:'Daily Quote', target:'Target', section:"Today's Content" },
    ru: { ayah:'Аят дня', dhikr:'Зикр дня', quote:'Цитата дня', target:'Цель', section:'Контент дня' },
    ar: { ayah:'آية اليوم', dhikr:'ذكر اليوم', quote:'اقتباس اليوم', target:'الهدف', section:'محتوى اليوم' },
    tr: { ayah:'Günün Ayeti', dhikr:'Günün Zikri', quote:'Günün Sözü', target:'Hedef', section:"Bugünün İçeriği" },
  }
  const l = TITLES[lang] || TITLES.az

  return (
    <View style={styles.dailySection}>
      <Text style={styles.dailyHeading}>🌟 {l.section}</Text>

      {content.hasAyah ? (
        <View style={[styles.dailyCard, { borderColor: '#10b981' + '40', backgroundColor: '#10b981' + '12' }]}>
          <View style={styles.dailyHead}>
            <Text style={styles.dailyEmoji}>📖</Text>
            <Text style={[styles.dailyLabel, { color: '#10b981' }]}>{l.ayah}</Text>
          </View>
          {content.ayah.ar ? <Text style={styles.dailyArabic}>{content.ayah.ar}</Text> : null}
          {(content.ayah.text?.[lang] || content.ayah.text?.en) ? (
            <Text style={styles.dailyText}>{content.ayah.text[lang] || content.ayah.text.en}</Text>
          ) : null}
          {content.ayah.source ? <Text style={[styles.dailySource, { color: '#10b981' }]}>— {content.ayah.source}</Text> : null}
        </View>
      ) : null}

      {content.hasDhikr ? (
        <View style={[styles.dailyCard, { borderColor: '#06b6d4' + '40', backgroundColor: '#06b6d4' + '12' }]}>
          <View style={styles.dailyHead}>
            <Text style={styles.dailyEmoji}>📿</Text>
            <Text style={[styles.dailyLabel, { color: '#06b6d4' }]}>{l.dhikr}</Text>
          </View>
          {content.dhikr.ar ? <Text style={styles.dailyArabic}>{content.dhikr.ar}</Text> : null}
          {content.dhikr.translit ? <Text style={[styles.dailyTranslit, { color: '#0891b2' }]}>{content.dhikr.translit}</Text> : null}
          {(content.dhikr.text?.[lang] || content.dhikr.text?.en) ? (
            <Text style={styles.dailyText}>{content.dhikr.text[lang] || content.dhikr.text.en}</Text>
          ) : null}
          {content.dhikr.count ? (
            <View style={[styles.dailyPill, { backgroundColor: '#06b6d4' + '18' }]}>
              <Text style={[styles.dailyPillText, { color: '#06b6d4' }]}>🎯 {l.target}: ×{content.dhikr.count}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {content.hasQuote ? (
        <View style={[styles.dailyCard, { borderColor: '#a855f7' + '40', backgroundColor: '#a855f7' + '12' }]}>
          <View style={styles.dailyHead}>
            <Text style={styles.dailyEmoji}>💬</Text>
            <Text style={[styles.dailyLabel, { color: '#a855f7' }]}>{l.quote}</Text>
          </View>
          {content.quote.ar ? <Text style={styles.dailyArabic}>{content.quote.ar}</Text> : null}
          {(content.quote.text?.[lang] || content.quote.text?.en) ? (
            <Text style={[styles.dailyText, { fontStyle: 'italic' }]}>"{content.quote.text[lang] || content.quote.text.en}"</Text>
          ) : null}
          {content.quote.source ? <Text style={[styles.dailySource, { color: '#a855f7' }]}>— {content.quote.source}</Text> : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  // Announcements
  annContainer: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  annCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderLeftWidth: 5,
  },
  annIcon: { fontSize: 24 },
  annTitle: { fontSize: 14.5, fontWeight: '800', color: Colors.text || '#1a2e1e' },
  annMsg: { fontSize: 13, color: Colors.textDim || '#4a6052', marginTop: 4, lineHeight: 18 },
  annLink: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  annClose: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // Hero Banner
  heroBanner: {
    padding: 32,
    margin: 16,
    borderRadius: 22,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    width: 280, height: 280, borderRadius: 140,
    top: -120, right: -80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroCircle2: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    bottom: -90, left: -70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroTitle: {
    fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center',
    letterSpacing: -0.5, lineHeight: 30, marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10,
  },
  heroSubtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.95)', textAlign: 'center',
    lineHeight: 21, marginBottom: 20, fontWeight: '500',
  },
  heroCta: {
    backgroundColor: '#fff',
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16,
    elevation: 8,
  },
  heroCtaText: { fontWeight: '800', fontSize: 14, letterSpacing: 0.3 },

  // Daily Content
  dailySection: { padding: 16, gap: 12 },
  dailyHeading: { fontSize: 22, fontWeight: '800', color: Colors.text || '#1a2e1e', letterSpacing: -0.3, marginBottom: 4 },
  dailyCard: { padding: 18, borderRadius: 18, borderWidth: 1.5 },
  dailyHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dailyEmoji: { fontSize: 22 },
  dailyLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  dailyArabic: {
    fontSize: 19, lineHeight: 30, textAlign: 'right',
    color: Colors.text || '#1a2e1e', marginBottom: 10,
  },
  dailyTranslit: { fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
  dailyText: { fontSize: 13.5, color: Colors.textDim || '#4a6052', lineHeight: 20, marginBottom: 8 },
  dailySource: { fontSize: 12, fontWeight: '700' },
  dailyPill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginTop: 6 },
  dailyPillText: { fontSize: 11, fontWeight: '800' },
})
