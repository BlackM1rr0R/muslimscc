import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { useLang } from '../contexts/LangContext'
import { Colors } from '../theme/colors'
import PageHero from '../components/PageHero'
import { subscribeToSettings } from '../data/adminContent'

// URL prioritet sırası (web ilə eyni):
//   1) Firebase Settings.apiUrl (admin paneldən, real-time)
//   2) app.json -> expo.extra.apiUrl (compile-time)
//   3) Constants.manifest / manifest2 (köhnə Expo formatları)
//   4) Hard default: https://muslims.cc  (production canonical)
function readExpoExtra() {
  const candidates = [
    Constants.expoConfig?.extra,
    Constants.manifest2?.extra?.expoClient?.extra,
    Constants.manifest?.extra,
  ]
  for (const c of candidates) {
    if (c?.apiUrl && typeof c.apiUrl === 'string' && /^https?:\/\//.test(c.apiUrl)) return c.apiUrl
  }
  return null
}
const FALLBACK_API_URL = readExpoExtra() || 'https://muslims.cc'
const STORAGE_KEY = 'mobile_aichat_messages'
const RATE_KEY = 'mobile_aichat_rate'
const MAX_PER_MIN = 5
const MIN_DELAY = 2
const COOLDOWN = 30

const LABELS = {
  az: {
    title:'MuslimAI', subtitle:'İslami AI köməkçi',
    placeholder:'Sualınızı yazın...',
    welcome:'Salam aleykum! Mən MuslimAI — İslami köməkçinizəm.',
    s1:'Namaz necə qılınır?', s2:'Səbr haqqında hədis', s3:'Tövhid nədir?', s4:'Ən fəzilətli dua?',
    disclaimer:'AI cavablar məlumat üçündür. Allah daha yaxşı bilir.',
    send:'Göndər', clear:'Təmizlə',
    rateLimit:'Çox sürətli yazırsınız. {s} saniyə gözləyin.',
    error:'Xəta. Yenidən cəhd edin.',
  },
  en: {
    title:'MuslimAI', subtitle:'Islamic AI assistant',
    placeholder:'Type your question...',
    welcome:'Assalamu alaikum! I am MuslimAI — your Islamic assistant.',
    s1:'How to pray?', s2:'Hadith about patience', s3:'What is Tawheed?', s4:'Most virtuous dua?',
    disclaimer:'AI answers are informational. Allah knows best.',
    send:'Send', clear:'Clear',
    rateLimit:'Too fast. Wait {s} seconds.',
    error:'Error. Try again.',
  },
  ru: { title:'MuslimAI', subtitle:'Исламский AI помощник', placeholder:'Напишите вопрос...', welcome:'Ас-саляму алейкум! Я MuslimAI.', s1:'Как совершать намаз?', s2:'Хадис о терпении', s3:'Что такое Таухид?', s4:'Лучшая дуа?', disclaimer:'Ответы AI информативны.', send:'Отправить', clear:'Очистить', rateLimit:'Подождите {s} сек.', error:'Ошибка.' },
  ar: { title:'MuslimAI', subtitle:'مساعد إسلامي', placeholder:'اكتب سؤالك...', welcome:'السلام عليكم! أنا MuslimAI.', s1:'كيف أصلي؟', s2:'حديث عن الصبر', s3:'ما هو التوحيد؟', s4:'أفضل دعاء؟', disclaimer:'إجابات الذكاء الاصطناعي للمعلومات.', send:'إرسال', clear:'مسح', rateLimit:'انتظر {s} ثانية.', error:'خطأ.' },
  tr: { title:'MuslimAI', subtitle:'İslami AI asistan', placeholder:'Sorunuzu yazın...', welcome:'Selamün aleyküm! Ben MuslimAI.', s1:'Namaz nasıl?', s2:'Sabırla ilgili hadis', s3:'Tevhid nedir?', s4:'En faziletli dua?', disclaimer:'AI cevapları bilgi içindir.', send:'Gönder', clear:'Temizle', rateLimit:'{s} saniye bekleyin.', error:'Hata.' },
}

export default function AIChatScreen() {
  const { lang } = useLang()
  const l = LABELS[lang] || LABELS.az

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [apiUrl, setApiUrl] = useState(FALLBACK_API_URL)
  const scrollRef = useRef(null)

  // Load saved messages
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(s => { if (s) try { setMessages(JSON.parse(s)) } catch {} })
  }, [])

  // Admin Firebase Settings-dən API URL-i real-time oxu
  useEffect(() => {
    const unsubscribe = subscribeToSettings((settings) => {
      const url = settings?.apiUrl?.trim()
      if (url && /^https?:\/\//.test(url)) {
        setApiUrl(url)
      } else {
        setApiUrl(FALLBACK_API_URL)
      }
    })
    return () => unsubscribe?.()
  }, [])

  // Save messages
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages])

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const checkRate = async () => {
    try {
      const raw = await AsyncStorage.getItem(RATE_KEY)
      const data = raw ? JSON.parse(raw) : {}
      const now = Date.now()
      if (data.cooldownUntil && data.cooldownUntil > now) {
        return { ok: false, remaining: Math.ceil((data.cooldownUntil - now) / 1000) }
      }
      const recent = (data.timestamps || []).filter(t => now - t < 60000)
      if (recent.length > 0 && (now - recent[recent.length - 1]) / 1000 < MIN_DELAY) {
        return { ok: false, remaining: MIN_DELAY }
      }
      if (recent.length >= MAX_PER_MIN) {
        const cooldownUntil = now + COOLDOWN * 1000
        await AsyncStorage.setItem(RATE_KEY, JSON.stringify({ timestamps: recent, cooldownUntil }))
        return { ok: false, remaining: COOLDOWN }
      }
      recent.push(now)
      await AsyncStorage.setItem(RATE_KEY, JSON.stringify({ timestamps: recent, cooldownUntil: null }))
      return { ok: true }
    } catch { return { ok: true } }
  }

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading || cooldown > 0) return

    const rate = await checkRate()
    if (!rate.ok) {
      setError(l.rateLimit.replace('{s}', rate.remaining))
      setCooldown(rate.remaining)
      return
    }

    setError('')
    setInput('')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const userMsg = { role:'user', content: msg, time: Date.now() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)

    const endpoint = `${apiUrl.replace(/\/$/, '')}/api/ask-ai`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: updated.slice(-10).map(m => ({ role: m.role, content: m.content })),
          lang,
        }),
      })
      const raw = await res.text()
      let data = {}
      try { data = raw ? JSON.parse(raw) : {} } catch { data = { error: raw?.slice(0, 200) || 'Invalid JSON' } }
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      if (!data.reply) throw new Error('Empty reply')
      setMessages([...updated, { role:'assistant', content: data.reply, time: Date.now() }])
    } catch (e) {
      console.warn('[MuslimAI] fetch failed', endpoint, e)
      setError(`${l.error} (${e.message || 'network'})`)
    }
    setLoading(false)
  }

  const handleClear = () => {
    setMessages([])
    AsyncStorage.removeItem(STORAGE_KEY)
  }

  const suggestions = [l.s1, l.s2, l.s3, l.s4]

  return (
    <KeyboardAvoidingView
      style={{ flex:1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <PageHero
        title={l.title}
        subtitle={l.subtitle}
        arabic="المُسَاعِدُ الإِسْلَامِيُّ"
        gradient={['#10b981', '#059669', '#047857']}
        icon="🌙"
      />

      <ScrollView ref={scrollRef} style={{ flex:1 }} contentContainerStyle={{ padding: 16 }}>
        {messages.length === 0 ? (
          <View style={styles.welcome}>
            <Text style={styles.welcomeIcon}>🌙</Text>
            <Text style={styles.welcomeText}>{l.welcome}</Text>
            <View style={styles.suggestions}>
              {suggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.suggestion} onPress={() => sendMessage(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {messages.map((m, i) => (
              <View key={i} style={[styles.bubbleWrap, m.role === 'user' ? styles.bubbleWrapUser : styles.bubbleWrapAI]}>
                {m.role === 'assistant' ? (
                  <LinearGradient colors={['#10b981','#059669']} style={styles.avatar}>
                    <Text style={{ fontSize: 14 }}>🌙</Text>
                  </LinearGradient>
                ) : null}
                <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
                  {m.role === 'user' ? (
                    <LinearGradient colors={['#10b981','#059669']} style={StyleSheet.absoluteFill} />
                  ) : null}
                  <Text style={[styles.bubbleText, m.role === 'user' && { color:'#fff' }]}>{m.content}</Text>
                </View>
              </View>
            ))}
            {loading ? (
              <View style={[styles.bubbleWrap, styles.bubbleWrapAI]}>
                <LinearGradient colors={['#10b981','#059669']} style={styles.avatar}>
                  <Text style={{ fontSize: 14 }}>🌙</Text>
                </LinearGradient>
                <View style={[styles.bubble, styles.bubbleAI]}>
                  <ActivityIndicator color="#10b981" size="small" />
                </View>
              </View>
            ) : null}
          </View>
        )}

        {cooldown > 0 ? (
          <View style={styles.cooldown}>
            <Text style={styles.cooldownIcon}>⏳</Text>
            <Text style={styles.cooldownText}>{l.rateLimit.replace('{s}', cooldown)}</Text>
          </View>
        ) : null}
        {cooldown === 0 && error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={cooldown > 0 ? l.rateLimit.replace('{s}', cooldown) : l.placeholder}
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
          editable={!loading && cooldown === 0}
          maxLength={500}
          multiline
        />
        <TouchableOpacity
          onPress={() => sendMessage()}
          disabled={loading || cooldown > 0 || !input.trim()}
          style={{ opacity: (loading || cooldown > 0 || !input.trim()) ? 0.4 : 1 }}
        >
          <LinearGradient colors={['#10b981','#059669']} style={styles.sendBtn}>
            <Text style={{ color:'#fff', fontSize: 16 }}>{loading ? '⏳' : (cooldown > 0 ? cooldown : '➤')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {messages.length > 0 ? (
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <Text style={styles.clearText}>🗑️ {l.clear}</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.disclaimer}>{l.disclaimer}</Text>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  welcome: { alignItems: 'center', padding: 30 },
  welcomeIcon: { fontSize: 56, marginBottom: 12 },
  welcomeText: { fontSize: 14.5, color: Colors.textMuted || '#7a9b82', textAlign: 'center', lineHeight: 22, marginBottom: 22 },
  suggestions: { width: '100%', gap: 10 },
  suggestion: {
    backgroundColor: Colors.bgCard || '#fff',
    borderWidth: 1.5,
    borderColor: Colors.border || '#e2e8df',
    borderRadius: 14,
    padding: 12,
  },
  suggestionText: { fontSize: 13.5, fontWeight: '600', color: Colors.text || '#1a2e1e' },

  bubbleWrap: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  bubbleWrapUser: { justifyContent: 'flex-end' },
  bubbleWrapAI: {},
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bubbleUser: { borderBottomRightRadius: 5 },
  bubbleAI: {
    backgroundColor: Colors.bgSoft || '#f1f5f9',
    borderWidth: 1,
    borderColor: Colors.border || '#e2e8df',
    borderBottomLeftRadius: 5,
  },
  bubbleText: { fontSize: 14, lineHeight: 20, color: Colors.text || '#1a2e1e' },

  cooldown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245,158,11,0.12)',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  cooldownIcon: { fontSize: 22 },
  cooldownText: { flex: 1, color: '#92400e', fontWeight: '700', fontSize: 13 },

  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', padding: 10, borderRadius: 10, marginTop: 12 },
  errorText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: Colors.bgCard || '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.border || '#e2e8df',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.bgSoft || '#f8fafc',
    borderRadius: 999,
    fontSize: 15,
    color: Colors.text || '#1a2e1e',
  },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },

  clearBtn: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 6 },
  clearText: { fontSize: 12, color: Colors.textMuted || '#7a9b82', fontWeight: '700' },
  disclaimer: { textAlign: 'center', fontSize: 11, color: Colors.textMuted || '#7a9b82', paddingHorizontal: 14, paddingBottom: 12 },
})
