import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
// NOTE: if Slider gives error, run: npx expo install @react-native-community/slider
import { useLang } from '../contexts/LangContext';
import { Colors, Shadows, BorderRadius } from '../theme/colors';
import { QUOTES } from '../data/quotes';
import { subscribeToQuotes } from '../data/adminContent';
import PageHero from '../components/PageHero';
import { FadeUp, ScaleIn } from '../components/Animated';

const { width: SW } = Dimensions.get('window');
const CARD_SIZE = SW - 48;

// ═══ 12 TEMA ═══
const THEMES = [
  { key:'green', label:'Green', colors:['#0d4a27','#1a6b3a','#22874a'], text:'#ffffff', dark:true },
  { key:'gold', label:'Gold', colors:['#8b6508','#b8860b','#d4a017'], text:'#ffffff', dark:true },
  { key:'dark', label:'Dark', colors:['#1a1a2e','#16213e','#0f3460'], text:'#ffffff', dark:true },
  { key:'mosque', label:'Mosque', colors:['#2d5016','#1a6b3a'], text:'#ffffff', dark:true },
  { key:'geo', label:'Geometric', colors:['#4a148c','#6a1b9a','#8e24aa'], text:'#ffffff', dark:true },
  { key:'minimal', label:'Minimal', colors:['#f7f8f5','#f7f8f5'], text:'#1a2e1e', dark:false },
  { key:'ocean', label:'Ocean', colors:['#0c4a6e','#0369a1','#0284c7'], text:'#ffffff', dark:true },
  { key:'sunset', label:'Sunset', colors:['#7c2d12','#9a3412','#ea580c'], text:'#ffffff', dark:true },
  { key:'rose', label:'Rose', colors:['#881337','#be123c','#e11d48'], text:'#ffffff', dark:true },
  { key:'emerald', label:'Emerald', colors:['#065f46','#059669','#34d399'], text:'#ffffff', dark:true },
  { key:'slate', label:'Slate', colors:['#0f172a','#1e293b','#475569'], text:'#ffffff', dark:true },
  { key:'sand', label:'Sand', colors:['#92400e','#d4a017','#fef3c7'], text:'#1a2e1e', dark:false },
];

// ═══ DEKOR TİPLƏRİ ═══
const DECOR_TYPES = {
  none: { top: '', bottom: '' },
  bismillah: { top: '﷽', bottom: '❁' },
  ornament: { top: '✦ ══ ✦', bottom: '✦ ══ ✦' },
  stars: { top: '✧ ✦ ✧', bottom: '✧ ✦ ✧' },
  dots: { top: '• • •', bottom: '• • •' },
  diamond: { top: '◆ ◇ ◆', bottom: '◆ ◇ ◆' },
  crescent: { top: '☽', bottom: '☽' },
  floral: { top: '❀ ❀ ❀', bottom: '❀ ❀ ❀' },
};

// ═══ 40 LAYOUT ═══
const LAYOUTS = [
  // Forma
  { key:'square', label:'◻️', cat:'shape', aspect:1, radius:20, decor:'bismillah' },
  { key:'portrait', label:'📱', cat:'shape', aspect:4/5, radius:20, decor:'bismillah' },
  { key:'story', label:'📲', cat:'shape', aspect:9/16, radius:20, decor:'bismillah' },
  { key:'landscape', label:'🖥️', cat:'shape', aspect:16/9, radius:20, decor:'bismillah' },
  { key:'circle', label:'⭕', cat:'shape', aspect:1, radius:999, decor:'none' },
  { key:'rounded', label:'🔲', cat:'shape', aspect:1, radius:60, decor:'bismillah' },
  { key:'flat', label:'⬜', cat:'shape', aspect:1, radius:0, decor:'none' },
  { key:'pill', label:'💊', cat:'shape', aspect:2, radius:999, decor:'none' },
  // Çərçivə
  { key:'frame-thin', label:'🔳', cat:'frame', aspect:1, radius:20, decor:'none', frame:'thin' },
  { key:'frame-thick', label:'⬛', cat:'frame', aspect:1, radius:20, decor:'none', frame:'thick' },
  { key:'frame-double', label:'🔲', cat:'frame', aspect:1, radius:20, decor:'none', frame:'double' },
  { key:'frame-dashed', label:'▪️', cat:'frame', aspect:1, radius:20, decor:'none', frame:'dashed' },
  { key:'frame-corner', label:'📐', cat:'frame', aspect:1, radius:0, decor:'none', frame:'corner' },
  { key:'frame-neon', label:'💡', cat:'frame', aspect:1, radius:20, decor:'none', frame:'neon' },
  { key:'frame-gradient', label:'🌈', cat:'frame', aspect:1, radius:20, decor:'none', frame:'gradient' },
  { key:'frame-shadow', label:'🌑', cat:'frame', aspect:1, radius:20, decor:'bismillah', frame:'shadow' },
  // Dekor
  { key:'d-bismillah', label:'﷽', cat:'decor', aspect:1, radius:20, decor:'bismillah' },
  { key:'d-ornament', label:'✦', cat:'decor', aspect:1, radius:20, decor:'ornament' },
  { key:'d-stars', label:'✧', cat:'decor', aspect:1, radius:20, decor:'stars' },
  { key:'d-dots', label:'•••', cat:'decor', aspect:1, radius:20, decor:'dots' },
  { key:'d-diamond', label:'◆', cat:'decor', aspect:1, radius:20, decor:'diamond' },
  { key:'d-crescent', label:'☽', cat:'decor', aspect:1, radius:20, decor:'crescent' },
  { key:'d-floral', label:'❀', cat:'decor', aspect:1, radius:20, decor:'floral' },
  { key:'d-quotemark', label:'"', cat:'decor', aspect:1, radius:20, decor:'none', quoteMark:true },
  // Yazı stili
  { key:'ar-big', label:'عربي', cat:'text', aspect:1, radius:20, decor:'bismillah', arSize:32 },
  { key:'ar-small', label:'عر', cat:'text', aspect:1, radius:20, decor:'ornament', arSize:18 },
  { key:'ar-only', label:'AR', cat:'text', aspect:1, radius:20, decor:'none', hideTranslation:true },
  { key:'tr-only', label:'TR', cat:'text', aspect:1, radius:20, decor:'bismillah', hideArabic:true },
  { key:'minimal-t', label:'MIN', cat:'text', aspect:1, radius:20, decor:'none' },
  { key:'paper', label:'📃', cat:'text', aspect:4/5, radius:4, decor:'none' },
  { key:'ticket', label:'🎫', cat:'text', aspect:5/2, radius:16, decor:'none' },
  { key:'split', label:'⬛⬜', cat:'text', aspect:1, radius:20, decor:'none', split:true },
  // Texture
  { key:'t-grid', label:'▦', cat:'overlay', aspect:1, radius:20, decor:'bismillah' },
  { key:'t-vignette', label:'🔆', cat:'overlay', aspect:1, radius:20, decor:'bismillah' },
  { key:'t-spotlight', label:'💫', cat:'overlay', aspect:1, radius:20, decor:'none' },
  { key:'t-diagonal', label:'╲', cat:'overlay', aspect:1, radius:20, decor:'none' },
  { key:'t-wave', label:'〰️', cat:'overlay', aspect:1, radius:20, decor:'none' },
  { key:'t-hex', label:'⬡', cat:'overlay', aspect:1, radius:20, decor:'none' },
  { key:'t-circles', label:'◉', cat:'overlay', aspect:1, radius:20, decor:'bismillah' },
  { key:'t-noise', label:'░', cat:'overlay', aspect:1, radius:20, decor:'none' },
];

const LAYOUT_CATS = [
  { key:'all', label:{ az:'Hamısı', en:'All', ru:'Все', ar:'الكل', tr:'Tümü' } },
  { key:'shape', label:{ az:'Forma', en:'Shape', ru:'Форма', ar:'شكل', tr:'Şekil' } },
  { key:'frame', label:{ az:'Çərçivə', en:'Frame', ru:'Рамка', ar:'إطار', tr:'Çerçeve' } },
  { key:'decor', label:{ az:'Dekor', en:'Decor', ru:'Декор', ar:'زخرفة', tr:'Dekor' } },
  { key:'text', label:{ az:'Yazı', en:'Text', ru:'Текст', ar:'نص', tr:'Yazı' } },
  { key:'overlay', label:{ az:'Tekstura', en:'Texture', ru:'Текстура', ar:'نسيج', tr:'Doku' } },
];

const LABELS = {
  az: { title:'İslami Sitatlar', sub:'Fərdiləşdirilmiş sitatlar yaradın və paylaşın', share:'Paylaş', next:'Növbəti', prev:'Əvvəlki', theme:'Mövzu', layout:'Dizayn', cat:'Kateqoriya', all:'Hamısı', quran:'Quran', hadith:'Hədis', dua:'Dua', wisdom:'Hikmət', customize:'Fərdiləşdir', arSize:'Ərəb yazı ölçüsü', trSize:'Tərcümə ölçüsü', opacity:'Şəffaflıq', borderW:'Çərçivə qalınlığı', reset:'Sıfırla', copy:'Kopyala', copied:'Kopyalandı!' },
  en: { title:'Islamic Quotes', sub:'Create & share customized quotes', share:'Share', next:'Next', prev:'Previous', theme:'Theme', layout:'Layout', cat:'Category', all:'All', quran:'Quran', hadith:'Hadith', dua:'Dua', wisdom:'Wisdom', customize:'Customize', arSize:'Arabic font size', trSize:'Translation size', opacity:'Opacity', borderW:'Border width', reset:'Reset', copy:'Copy', copied:'Copied!' },
  ru: { title:'Исламские Цитаты', sub:'Создайте и поделитесь цитатами', share:'Поделиться', next:'Далее', prev:'Назад', theme:'Тема', layout:'Макет', cat:'Категория', all:'Все', quran:'Коран', hadith:'Хадис', dua:'Дуа', wisdom:'Мудрость', customize:'Настроить', arSize:'Размер арабского', trSize:'Размер перевода', opacity:'Прозрачность', borderW:'Ширина рамки', reset:'Сброс', copy:'Копировать', copied:'Скопировано!' },
  ar: { title:'اقتباسات إسلامية', sub:'أنشئ وشارك اقتباسات مخصصة', share:'مشاركة', next:'التالي', prev:'السابق', theme:'المظهر', layout:'التصميم', cat:'الفئة', all:'الكل', quran:'القرآن', hadith:'الحديث', dua:'الدعاء', wisdom:'حكمة', customize:'تخصيص', arSize:'حجم الخط العربي', trSize:'حجم الترجمة', opacity:'الشفافية', borderW:'عرض الإطار', reset:'إعادة تعيين', copy:'نسخ', copied:'!تم النسخ' },
  tr: { title:'İslami Alıntılar', sub:'Özelleştirilmiş alıntılar oluşturun', share:'Paylaş', next:'Sonraki', prev:'Önceki', theme:'Tema', layout:'Düzen', cat:'Kategori', all:'Tümü', quran:'Kuran', hadith:'Hadis', dua:'Dua', wisdom:'Hikmet', customize:'Özelleştir', arSize:'Arapça boyutu', trSize:'Çeviri boyutu', opacity:'Opaklık', borderW:'Kenarlık genişliği', reset:'Sıfırla', copy:'Kopyala', copied:'Kopyalandı!' },
};

export default function QuoteGeneratorScreen() {
  const { lang, dark } = useLang();
  const c = dark ? Colors.dark : Colors.light;
  const l = LABELS[lang] || LABELS.az;
  const shadow = dark ? Shadows.dark.lg : Shadows.lg;

  const [themeIdx, setThemeIdx] = useState(0);
  const [layoutIdx, setLayoutIdx] = useState(0);
  const [catFilter, setCatFilter] = useState('all');
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [showCustom, setShowCustom] = useState(false);
  const [layoutCat, setLayoutCat] = useState('all');
  const [copied, setCopied] = useState(false);

  // Customization
  const [arFontSize, setArFontSize] = useState(24);
  const [trFontSize, setTrFontSize] = useState(15);
  const [cardOpacity, setCardOpacity] = useState(100);
  const [borderWidth, setBorderWidth] = useState(0);

  // Admin paneldən əlavə edilmiş sitatları real-time qarışdır
  const [customQuotes, setCustomQuotes] = useState([])
  useEffect(() => {
    const unsubscribe = subscribeToQuotes((items) => {
      const mapped = (items || []).map(q => ({
        id: 'custom-' + q.id,
        cat: q.category || q.cat || 'general',
        ar: q.ar || q.arabic || '',
        text: q.text?.[lang] || q.text?.en || '',
        author: q.author || q.source || 'Admin',
      })).filter(q => q.text || q.ar)
      setCustomQuotes(mapped)
    })
    return () => unsubscribe?.()
  }, [lang])

  const allQuotes = [...customQuotes, ...(QUOTES || [])];
  const filtered = catFilter === 'all' ? allQuotes : allQuotes.filter(q => q.cat === catFilter);
  const quote = filtered[quoteIdx % Math.max(filtered.length, 1)];
  const theme = THEMES[themeIdx];
  const layout = LAYOUTS[layoutIdx];
  const decor = DECOR_TYPES[layout.decor] || DECOR_TYPES.none;

  const filteredLayouts = layoutCat === 'all' ? LAYOUTS : LAYOUTS.filter(l2 => l2.cat === layoutCat);

  const next = () => setQuoteIdx(i => (i + 1) % Math.max(filtered.length, 1));
  const prev = () => setQuoteIdx(i => (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1));

  const shareQuote = async () => {
    if (!quote) return;
    const text = quote.text?.[lang] || quote.text?.en || '';
    try { await Share.share({ message: `${quote.ar || ''}\n\n${text}\n\n— ${quote.source}\n\nmuslims.cc` }); } catch {}
  };

  const copyQuote = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardW = layout.aspect > 1 ? CARD_SIZE : CARD_SIZE;
  const cardH = layout.aspect > 1 ? CARD_SIZE / layout.aspect : CARD_SIZE / layout.aspect;

  // Frame styles
  const getFrameStyle = () => {
    if (!layout.frame) return {};
    const base = { position: 'absolute', borderRadius: layout.radius > 100 ? layout.radius - 8 : 8 };
    switch (layout.frame) {
      case 'thin': return { ...base, top: 14, bottom: 14, left: 14, right: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' };
      case 'thick': return { ...base, top: 10, bottom: 10, left: 10, right: 10, borderWidth: 5, borderColor: 'rgba(255,255,255,0.12)' };
      case 'double': return { ...base, top: 12, bottom: 12, left: 12, right: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' };
      case 'dashed': return { ...base, top: 12, bottom: 12, left: 12, right: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)', borderStyle: 'dashed' };
      case 'neon': return { ...base, top: 8, bottom: 8, left: 8, right: 8, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' };
      case 'gradient': return { ...base, top: 8, bottom: 8, left: 8, right: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' };
      case 'corner': return {};
      case 'shadow': return {};
      default: return {};
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} showsVerticalScrollIndicator={false}>
      <PageHero arabic="اقتباسات" title={l.title} subtitle={l.sub} theme="quotes" />

      <View style={styles.content}>
        {/* ═══ Category Filter ═══ */}
        <FadeUp delay={100}>
          <Text style={[styles.controlLabel, { color: c.textMuted }]}>{l.cat}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8 }}>
            {['all','quran','hadith','dua','wisdom'].map(cat => (
              <TouchableOpacity key={cat} style={[styles.filterBtn, { backgroundColor: catFilter === cat ? c.primary : c.card, borderColor: catFilter === cat ? c.primary : c.cardBorder }]} onPress={() => { setCatFilter(cat); setQuoteIdx(0); }}>
                <Text style={[styles.filterText, { color: catFilter === cat ? '#fff' : c.textSecondary }]}>{l[cat]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </FadeUp>

        {/* ═══ Quote Card ═══ */}
        {quote && (
          <ScaleIn delay={200}>
            <LinearGradient
              colors={theme.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.quoteCard, {
                borderRadius: Math.min(layout.radius, 100),
                width: cardW,
                minHeight: Math.min(cardH, CARD_SIZE * 1.2),
                opacity: cardOpacity / 100,
                borderWidth: borderWidth,
                borderColor: 'rgba(255,255,255,0.3)',
              }, shadow]}
            >
              {/* Frame overlay */}
              {layout.frame && <View style={[getFrameStyle()]} pointerEvents="none" />}

              {/* Quote mark */}
              {layout.quoteMark && (
                <Text style={[styles.quoteMarkDecor, { color: theme.text }]}>"</Text>
              )}

              {/* Top decor */}
              {decor.top ? <Text style={[styles.decorText, { color: theme.text }]}>{decor.top}</Text> : null}

              {/* Arabic */}
              {!layout.hideArabic && quote.ar && (
                <Text style={[styles.quoteArabic, { color: theme.text, fontSize: layout.arSize || arFontSize }]}>{quote.ar}</Text>
              )}

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: theme.text }]} />

              {/* Translation */}
              {!layout.hideTranslation && (
                <Text style={[styles.quoteText, { color: theme.text, fontSize: trFontSize }]}>
                  {quote.text?.[lang] || quote.text?.en || ''}
                </Text>
              )}

              {/* Source */}
              <Text style={[styles.quoteSource, { color: theme.text }]}>— {quote.source}</Text>

              {/* Bottom decor */}
              {decor.bottom ? <Text style={[styles.decorText, { color: theme.text }]}>{decor.bottom}</Text> : null}

              {/* Watermark */}
              <Text style={[styles.watermark, { color: theme.text }]}>muslims.cc</Text>
            </LinearGradient>
          </ScaleIn>
        )}

        {/* ═══ Navigation ═══ */}
        <FadeUp delay={300}>
          <View style={styles.navRow}>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: c.surfaceAlt, borderColor: c.border }]} onPress={prev}>
              <Text style={[styles.navText, { color: c.text }]}>← {l.prev}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: c.primary }, Shadows.button]} onPress={shareQuote}>
              <Text style={styles.shareBtnText}>📤 {l.share}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: copied ? c.success : c.surfaceAlt, borderColor: copied ? c.success : c.border }]} onPress={copyQuote}>
              <Text style={[styles.navText, { color: copied ? '#fff' : c.text }]}>{copied ? `✅ ${l.copied}` : `📋 ${l.copy}`}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: c.surfaceAlt, borderColor: c.border }]} onPress={next}>
              <Text style={[styles.navText, { color: c.text }]}>{l.next} →</Text>
            </TouchableOpacity>
          </View>
        </FadeUp>

        {/* ═══ Theme Selector ═══ */}
        <FadeUp delay={350}>
          <Text style={[styles.controlLabel, { color: c.textMuted }]}>{l.theme}</Text>
          <View style={styles.themeGrid}>
            {THEMES.map((t2, i) => (
              <TouchableOpacity key={i} onPress={() => setThemeIdx(i)}>
                <LinearGradient
                  colors={t2.colors}
                  style={[styles.themeBtn, themeIdx === i && styles.themeBtnActive]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </FadeUp>

        {/* ═══ Layout Selector ═══ */}
        <FadeUp delay={400}>
          <Text style={[styles.controlLabel, { color: c.textMuted }]}>{l.layout}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }} contentContainerStyle={{ gap: 6 }}>
            {LAYOUT_CATS.map(lc => (
              <TouchableOpacity key={lc.key} style={[styles.layoutCatBtn, { backgroundColor: layoutCat === lc.key ? c.primary : c.card, borderColor: layoutCat === lc.key ? c.primary : c.cardBorder }]} onPress={() => setLayoutCat(lc.key)}>
                <Text style={[styles.layoutCatText, { color: layoutCat === lc.key ? '#fff' : c.textSecondary }]}>{lc.label[lang] || lc.label.en}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.layoutGrid}>
            {filteredLayouts.map((lay, i) => (
              <TouchableOpacity
                key={lay.key}
                style={[styles.layoutBtn, {
                  backgroundColor: layoutIdx === LAYOUTS.indexOf(lay) ? c.primary : c.card,
                  borderColor: layoutIdx === LAYOUTS.indexOf(lay) ? c.primary : c.cardBorder,
                }]}
                onPress={() => setLayoutIdx(LAYOUTS.indexOf(lay))}
              >
                <Text style={[styles.layoutBtnText, { color: layoutIdx === LAYOUTS.indexOf(lay) ? '#fff' : c.textSecondary }]}>{lay.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeUp>

        {/* ═══ Customization ═══ */}
        <FadeUp delay={450}>
          <TouchableOpacity
            style={[styles.customToggle, { backgroundColor: showCustom ? c.primaryBg : c.card, borderColor: showCustom ? c.primaryBorder : c.borderMd }]}
            onPress={() => setShowCustom(!showCustom)}
          >
            <Text style={[styles.customToggleText, { color: showCustom ? c.primary : c.textSecondary }]}>🎨 {l.customize} {showCustom ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showCustom && (
            <FadeUp duration={300}>
              <View style={[styles.customPanel, { backgroundColor: c.card, borderColor: c.border }]}>
                {/* Arabic font size */}
                <View style={styles.sliderRow}>
                  <Text style={[styles.sliderLabel, { color: c.textSecondary }]}>{l.arSize}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={14}
                    maximumValue={42}
                    step={1}
                    value={arFontSize}
                    onValueChange={setArFontSize}
                    minimumTrackTintColor={c.primary}
                    maximumTrackTintColor={c.border}
                    thumbTintColor={c.primary}
                  />
                  <Text style={[styles.sliderValue, { color: c.primary }]}>{arFontSize}px</Text>
                </View>

                {/* Translation font size */}
                <View style={styles.sliderRow}>
                  <Text style={[styles.sliderLabel, { color: c.textSecondary }]}>{l.trSize}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={10}
                    maximumValue={24}
                    step={1}
                    value={trFontSize}
                    onValueChange={setTrFontSize}
                    minimumTrackTintColor={c.primary}
                    maximumTrackTintColor={c.border}
                    thumbTintColor={c.primary}
                  />
                  <Text style={[styles.sliderValue, { color: c.primary }]}>{trFontSize}px</Text>
                </View>

                {/* Opacity */}
                <View style={styles.sliderRow}>
                  <Text style={[styles.sliderLabel, { color: c.textSecondary }]}>{l.opacity}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={30}
                    maximumValue={100}
                    step={5}
                    value={cardOpacity}
                    onValueChange={setCardOpacity}
                    minimumTrackTintColor={c.primary}
                    maximumTrackTintColor={c.border}
                    thumbTintColor={c.primary}
                  />
                  <Text style={[styles.sliderValue, { color: c.primary }]}>{cardOpacity}%</Text>
                </View>

                {/* Border width */}
                <View style={styles.sliderRow}>
                  <Text style={[styles.sliderLabel, { color: c.textSecondary }]}>{l.borderW}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={10}
                    step={1}
                    value={borderWidth}
                    onValueChange={setBorderWidth}
                    minimumTrackTintColor={c.primary}
                    maximumTrackTintColor={c.border}
                    thumbTintColor={c.primary}
                  />
                  <Text style={[styles.sliderValue, { color: c.primary }]}>{borderWidth}px</Text>
                </View>

                {/* Reset */}
                <TouchableOpacity style={[styles.resetBtn, { borderColor: c.borderMd }]} onPress={() => { setArFontSize(24); setTrFontSize(15); setCardOpacity(100); setBorderWidth(0); }}>
                  <Text style={[styles.resetText, { color: c.textMuted }]}>🔄 {l.reset}</Text>
                </TouchableOpacity>
              </View>
            </FadeUp>
          )}
        </FadeUp>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16 },

  // Controls
  controlLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 20 },
  filterScroll: { marginBottom: 16 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  filterText: { fontSize: 13, fontWeight: '600' },

  // Quote Card
  quoteCard: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  quoteArabic: { textAlign: 'center', lineHeight: 40, marginBottom: 16, writingDirection: 'rtl' },
  divider: { width: 48, height: 2, opacity: 0.4, marginBottom: 16 },
  quoteText: { textAlign: 'center', lineHeight: 24, marginBottom: 16, opacity: 0.92, paddingHorizontal: 8 },
  quoteSource: { fontSize: 13, fontWeight: '600', opacity: 0.7, letterSpacing: 0.5 },
  watermark: { position: 'absolute', bottom: 14, right: 18, fontSize: 11, fontWeight: '700', opacity: 0.25, letterSpacing: 1 },
  decorText: { fontSize: 20, opacity: 0.3, marginVertical: 8 },
  quoteMarkDecor: { position: 'absolute', top: 12, left: 20, fontSize: 56, opacity: 0.08 },

  // Navigation
  navRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 8 },
  navBtn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: BorderRadius.sm, borderWidth: 1.5 },
  navText: { fontWeight: '600', fontSize: 13 },
  shareBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.sm },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Theme selector
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  themeBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 2.5, borderColor: 'transparent' },
  themeBtnActive: { borderColor: '#ffffff', borderWidth: 3, transform: [{ scale: 1.12 }] },

  // Layout selector
  layoutCatBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  layoutCatText: { fontSize: 12, fontWeight: '600' },
  layoutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  layoutBtn: { height: 44, minWidth: 48, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  layoutBtnText: { fontSize: 14, fontWeight: '600' },

  // Customization
  customToggle: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: BorderRadius.md, borderWidth: 1.5, marginTop: 16, alignItems: 'center' },
  customToggleText: { fontSize: 14, fontWeight: '600' },
  customPanel: { padding: 20, borderRadius: BorderRadius.lg, borderWidth: 1, marginTop: 10 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sliderLabel: { fontSize: 13, fontWeight: '500', width: 110 },
  slider: { flex: 1, height: 40 },
  sliderValue: { width: 50, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  resetBtn: { alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginTop: 4 },
  resetText: { fontSize: 13, fontWeight: '600' },
});
