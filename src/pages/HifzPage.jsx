import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { haptic } from '../hooks/useHaptic'
import { getSurahLocal } from '../data/surahNamesAz'
import QuranMap from '../components/QuranMap'
import { navGroupLabel } from '../data/navigation'
import Icon from '../components/Icon'
import { AYAH_WORDS, ayahCountText, pluralWord, displayAyah } from '../utils/quranText'
import { ayahSources, readAudioPrefs, reciterName } from '../utils/quranAudio'
import {
  loadState as loadSrs, saveState as saveSrs, dateKey, todayStats, streak, perSurahCounts,
  memorisedSeries, dueItems, nextNewAyahs, gradeItem, setGoal, seedItems, previewIntervals,
  newItem, splitAyahWords, addDays, GRADES, GOAL_MIN, GOAL_MAX,
} from '../utils/hifzSrs'
import { isPlainClick } from '../components/PageLink'
import { pathFor } from '../seo/routes'
import { ColumnChart, Donut, ProgressRing, ProgressBar } from '../components/viz'
import { HIFZ_GUIDE } from '../data/guides/HifzPage'
import HifzInsights from '../components/insights/HifzInsights'
import '../styles/HifzPage.css'
import DeferRender from '../components/DeferRender'
// v5.9: əkiz ayələr (mutəşabihat) — bölməyə yaxınlaşanda
const TwinAyahs = lazy(() => import('../components/hifz/TwinAyahs'))
// v6.2: məşq kartında "Tapmaca" — qarışıq sözləri sırası ilə düzmək (toxunuşla, nitq tanıma yoxdur)
const AyahPuzzle = lazy(() => import('../components/hifz/AyahPuzzle'))
const PUZZLE_LABEL = { az: 'Tapmaca', en: 'Puzzle', ru: 'Головоломка', ar: 'ترتيب الكلمات', tr: 'Bulmaca' }
import { pickUi } from '../utils/uiText'

// 5 dilli sahə → cari dil (funksiya da ola bilər — rəqəmli mətnlər)
const pk = (o, lang) => (o == null ? '' : typeof o === 'string' ? o : (o[lang] !== undefined ? o[lang] : o.az))
const pkf = (o, lang, n) => { const f = pk(o, lang); return typeof f === 'function' ? f(n) : f }
// Quranda ümumi ayə sayı (Kufə sayı)
const QURAN_AYAHS = 6236

/** Əzbərlənmiş ayə sayı: köhnə izləyicidə "əzbər" surə — bütün ayələri; qalanı — SRS siyahısı */
function memorisedAyahs(progress, counts) {
  let n = 0
  for (const s of SURAHS) n += progress[s.num] === 2 ? s.ayahs : Math.min(s.ayahs, counts[s.num] || 0)
  return n
}

// ── localStorage helpers ──
const STORAGE_KEY = 'hifz_progress'
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    // Pozuq məlumat (null, massiv, sətir, səhv status) səhifəni çökdürməsin —
    // yalnız 1..114 surə nömrəsi və 1/2 statusu saxlanılır
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
    const clean = {}
    for (const [k, v] of Object.entries(data)) {
      const n = Number(k), st = Number(v)
      if (Number.isInteger(n) && n >= 1 && n <= 114 && (st === 1 || st === 2)) clean[n] = st
    }
    return clean
  } catch { return {} }
}
function saveProgress(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

const LABELS = {
  az: { title:'Hifz izləyicisi', subtitle:'Quran əzbərləmə izləyicisi', hint:'Statusu dəyişmək üçün surəyə toxunun', all:'Hamısı', memorized:'Əzbərləmişəm', inProgress:'Davam edir', notStarted:'Başlanmayıb', surahCount:'surə', ayahCount:'ayə', progress:'İrəliləyiş', juz:'Cüz', total:'Ümumi', reset:'Sıfırla', confirmReset:'Əminsiniz?', empty:'Bu siyahıda hələ surə yoxdur', filterLabel:'Statusa görə süzgəc', ofTotal:'114 surədən {n}' },
  en: { title:'Hifz Tracker', subtitle:'Quran memorization tracker', hint:'Tap a surah to change its status', all:'All', memorized:'Memorized', inProgress:'In Progress', notStarted:'Not Started', surahCount:'surahs', ayahCount:'ayahs', progress:'Progress', juz:'Juz', total:'Total', reset:'Reset', confirmReset:'Are you sure?', empty:'No surahs in this list yet', filterLabel:'Filter by status', ofTotal:'{n} of 114 surahs' },
  ru: { title:'Хифз Трекер', subtitle:'Отслеживание заучивания Корана', hint:'Нажмите на суру, чтобы сменить статус', all:'Все', memorized:'Выучено', inProgress:'В процессе', notStarted:'Не начато', surahCount:'сур', ayahCount:'аятов', progress:'Прогресс', juz:'Джуз', total:'Всего', reset:'Сброс', confirmReset:'Вы уверены?', empty:'В этом списке пока нет сур', filterLabel:'Фильтр по статусу', ofTotal:'{n} из 114 сур' },
  ar: { title:'متابعة الحفظ', subtitle:'متابعة حفظ القرآن الكريم', hint:'اضغط على السورة لتغيير حالتها', all:'الكل', memorized:'محفوظ', inProgress:'قيد الحفظ', notStarted:'لم يبدأ', surahCount:'سورة', ayahCount:'آية', progress:'التقدم', juz:'جزء', total:'الإجمالي', reset:'إعادة', confirmReset:'هل أنت متأكد؟', empty:'لا توجد سور في هذه القائمة بعد', filterLabel:'تصفية حسب الحالة', ofTotal:'{n} من 114 سورة' },
  tr: { title:'Hıfz Takip', subtitle:'Kuran ezberleme takipçisi', hint:'Durumu değiştirmek için sureye dokunun', all:'Tümü', memorized:'Ezberledim', inProgress:'Devam ediyor', notStarted:'Başlanmadı', surahCount:'sure', ayahCount:'ayet', progress:'İlerleme', juz:'Cüz', total:'Toplam', reset:'Sıfırla', confirmReset:'Emin misiniz?', empty:'Bu listede henüz sure yok', filterLabel:'Duruma göre filtrele', ofTotal:'114 sureden {n}' },
}

// status: 0 = not started, 1 = in progress, 2 = memorized
// Ayə sayı rəqəmə uyğun formada ("123 аята", "7 آيات"); ingiliscədə bu səhifə "ayahs" deyir
const HIFZ_AYAH_WORDS = { ...AYAH_WORDS, en: { one: 'ayah', few: 'ayahs', many: 'ayahs', other: 'ayahs' } }

const STATUS_LABELS = {
  az: ['Başlanmayıb','Davam edir','Əzbərləmişəm'],
  en: ['Not Started','In Progress','Memorized'],
  ru: ['Не начато','В процессе','Выучено'],
  ar: ['لم يبدأ','قيد الحفظ','محفوظ'],
  tr: ['Başlanmadı','Devam ediyor','Ezberledim'],
}

const SURAHS = [
  { num:1, name:'الفاتحة', en:'Al-Fatiha', ayahs:7, juz:1 },
  { num:2, name:'البقرة', en:'Al-Baqarah', ayahs:286, juz:1 },
  { num:3, name:'آل عمران', en:'Aal-E-Imran', ayahs:200, juz:3 },
  { num:4, name:'النساء', en:'An-Nisa', ayahs:176, juz:4 },
  { num:5, name:'المائدة', en:'Al-Ma\'idah', ayahs:120, juz:6 },
  { num:6, name:'الأنعام', en:'Al-An\'am', ayahs:165, juz:7 },
  { num:7, name:'الأعراف', en:'Al-A\'raf', ayahs:206, juz:8 },
  { num:8, name:'الأنفال', en:'Al-Anfal', ayahs:75, juz:9 },
  { num:9, name:'التوبة', en:'At-Tawbah', ayahs:129, juz:10 },
  { num:10, name:'يونس', en:'Yunus', ayahs:109, juz:11 },
  { num:11, name:'هود', en:'Hud', ayahs:123, juz:11 },
  { num:12, name:'يوسف', en:'Yusuf', ayahs:111, juz:12 },
  { num:13, name:'الرعد', en:'Ar-Ra\'d', ayahs:43, juz:13 },
  { num:14, name:'إبراهيم', en:'Ibrahim', ayahs:52, juz:13 },
  { num:15, name:'الحجر', en:'Al-Hijr', ayahs:99, juz:14 },
  { num:16, name:'النحل', en:'An-Nahl', ayahs:128, juz:14 },
  { num:17, name:'الإسراء', en:'Al-Isra', ayahs:111, juz:15 },
  { num:18, name:'الكهف', en:'Al-Kahf', ayahs:110, juz:15 },
  { num:19, name:'مريم', en:'Maryam', ayahs:98, juz:16 },
  { num:20, name:'طه', en:'Ta-Ha', ayahs:135, juz:16 },
  { num:21, name:'الأنبياء', en:'Al-Anbiya', ayahs:112, juz:17 },
  { num:22, name:'الحج', en:'Al-Hajj', ayahs:78, juz:17 },
  { num:23, name:'المؤمنون', en:'Al-Mu\'minun', ayahs:118, juz:18 },
  { num:24, name:'النور', en:'An-Nur', ayahs:64, juz:18 },
  { num:25, name:'الفرقان', en:'Al-Furqan', ayahs:77, juz:18 },
  { num:26, name:'الشعراء', en:'Ash-Shu\'ara', ayahs:227, juz:19 },
  { num:27, name:'النمل', en:'An-Naml', ayahs:93, juz:19 },
  { num:28, name:'القصص', en:'Al-Qasas', ayahs:88, juz:20 },
  { num:29, name:'العنكبوت', en:'Al-Ankabut', ayahs:69, juz:20 },
  { num:30, name:'الروم', en:'Ar-Rum', ayahs:60, juz:21 },
  { num:31, name:'لقمان', en:'Luqman', ayahs:34, juz:21 },
  { num:32, name:'السجدة', en:'As-Sajdah', ayahs:30, juz:21 },
  { num:33, name:'الأحزاب', en:'Al-Ahzab', ayahs:73, juz:21 },
  { num:34, name:'سبأ', en:'Saba', ayahs:54, juz:22 },
  { num:35, name:'فاطر', en:'Fatir', ayahs:45, juz:22 },
  { num:36, name:'يس', en:'Ya-Sin', ayahs:83, juz:22 },
  { num:37, name:'الصافات', en:'As-Saffat', ayahs:182, juz:23 },
  { num:38, name:'ص', en:'Sad', ayahs:88, juz:23 },
  { num:39, name:'الزمر', en:'Az-Zumar', ayahs:75, juz:23 },
  { num:40, name:'غافر', en:'Ghafir', ayahs:85, juz:24 },
  { num:41, name:'فصلت', en:'Fussilat', ayahs:54, juz:24 },
  { num:42, name:'الشورى', en:'Ash-Shura', ayahs:53, juz:25 },
  { num:43, name:'الزخرف', en:'Az-Zukhruf', ayahs:89, juz:25 },
  { num:44, name:'الدخان', en:'Ad-Dukhan', ayahs:59, juz:25 },
  { num:45, name:'الجاثية', en:'Al-Jathiyah', ayahs:37, juz:25 },
  { num:46, name:'الأحقاف', en:'Al-Ahqaf', ayahs:35, juz:26 },
  { num:47, name:'محمد', en:'Muhammad', ayahs:38, juz:26 },
  { num:48, name:'الفتح', en:'Al-Fath', ayahs:29, juz:26 },
  { num:49, name:'الحجرات', en:'Al-Hujurat', ayahs:18, juz:26 },
  { num:50, name:'ق', en:'Qaf', ayahs:45, juz:26 },
  { num:51, name:'الذاريات', en:'Adh-Dhariyat', ayahs:60, juz:26 },
  { num:52, name:'الطور', en:'At-Tur', ayahs:49, juz:27 },
  { num:53, name:'النجم', en:'An-Najm', ayahs:62, juz:27 },
  { num:54, name:'القمر', en:'Al-Qamar', ayahs:55, juz:27 },
  { num:55, name:'الرحمن', en:'Ar-Rahman', ayahs:78, juz:27 },
  { num:56, name:'الواقعة', en:'Al-Waqi\'ah', ayahs:96, juz:27 },
  { num:57, name:'الحديد', en:'Al-Hadid', ayahs:29, juz:27 },
  { num:58, name:'المجادلة', en:'Al-Mujadilah', ayahs:22, juz:28 },
  { num:59, name:'الحشر', en:'Al-Hashr', ayahs:24, juz:28 },
  { num:60, name:'الممتحنة', en:'Al-Mumtahanah', ayahs:13, juz:28 },
  { num:61, name:'الصف', en:'As-Saff', ayahs:14, juz:28 },
  { num:62, name:'الجمعة', en:'Al-Jumu\'ah', ayahs:11, juz:28 },
  { num:63, name:'المنافقون', en:'Al-Munafiqun', ayahs:11, juz:28 },
  { num:64, name:'التغابن', en:'At-Taghabun', ayahs:18, juz:28 },
  { num:65, name:'الطلاق', en:'At-Talaq', ayahs:12, juz:28 },
  { num:66, name:'التحريم', en:'At-Tahrim', ayahs:12, juz:28 },
  { num:67, name:'الملك', en:'Al-Mulk', ayahs:30, juz:29 },
  { num:68, name:'القلم', en:'Al-Qalam', ayahs:52, juz:29 },
  { num:69, name:'الحاقة', en:'Al-Haqqah', ayahs:52, juz:29 },
  { num:70, name:'المعارج', en:'Al-Ma\'arij', ayahs:44, juz:29 },
  { num:71, name:'نوح', en:'Nuh', ayahs:28, juz:29 },
  { num:72, name:'الجن', en:'Al-Jinn', ayahs:28, juz:29 },
  { num:73, name:'المزمل', en:'Al-Muzzammil', ayahs:20, juz:29 },
  { num:74, name:'المدثر', en:'Al-Muddaththir', ayahs:56, juz:29 },
  { num:75, name:'القيامة', en:'Al-Qiyamah', ayahs:40, juz:29 },
  { num:76, name:'الإنسان', en:'Al-Insan', ayahs:31, juz:29 },
  { num:77, name:'المرسلات', en:'Al-Mursalat', ayahs:50, juz:29 },
  { num:78, name:'النبأ', en:'An-Naba', ayahs:40, juz:30 },
  { num:79, name:'النازعات', en:'An-Nazi\'at', ayahs:46, juz:30 },
  { num:80, name:'عبس', en:'Abasa', ayahs:42, juz:30 },
  { num:81, name:'التكوير', en:'At-Takwir', ayahs:29, juz:30 },
  { num:82, name:'الانفطار', en:'Al-Infitar', ayahs:19, juz:30 },
  { num:83, name:'المطففين', en:'Al-Mutaffifin', ayahs:36, juz:30 },
  { num:84, name:'الانشقاق', en:'Al-Inshiqaq', ayahs:25, juz:30 },
  { num:85, name:'البروج', en:'Al-Buruj', ayahs:22, juz:30 },
  { num:86, name:'الطارق', en:'At-Tariq', ayahs:17, juz:30 },
  { num:87, name:'الأعلى', en:'Al-A\'la', ayahs:19, juz:30 },
  { num:88, name:'الغاشية', en:'Al-Ghashiyah', ayahs:26, juz:30 },
  { num:89, name:'الفجر', en:'Al-Fajr', ayahs:30, juz:30 },
  { num:90, name:'البلد', en:'Al-Balad', ayahs:20, juz:30 },
  { num:91, name:'الشمس', en:'Ash-Shams', ayahs:15, juz:30 },
  { num:92, name:'الليل', en:'Al-Layl', ayahs:21, juz:30 },
  { num:93, name:'الضحى', en:'Ad-Duha', ayahs:11, juz:30 },
  { num:94, name:'الشرح', en:'Ash-Sharh', ayahs:8, juz:30 },
  { num:95, name:'التين', en:'At-Tin', ayahs:8, juz:30 },
  { num:96, name:'العلق', en:'Al-Alaq', ayahs:19, juz:30 },
  { num:97, name:'القدر', en:'Al-Qadr', ayahs:5, juz:30 },
  { num:98, name:'البينة', en:'Al-Bayyinah', ayahs:8, juz:30 },
  { num:99, name:'الزلزلة', en:'Az-Zalzalah', ayahs:8, juz:30 },
  { num:100, name:'العاديات', en:'Al-Adiyat', ayahs:11, juz:30 },
  { num:101, name:'القارعة', en:'Al-Qari\'ah', ayahs:11, juz:30 },
  { num:102, name:'التكاثر', en:'At-Takathur', ayahs:8, juz:30 },
  { num:103, name:'العصر', en:'Al-Asr', ayahs:3, juz:30 },
  { num:104, name:'الهمزة', en:'Al-Humazah', ayahs:9, juz:30 },
  { num:105, name:'الفيل', en:'Al-Fil', ayahs:5, juz:30 },
  { num:106, name:'قريش', en:'Quraysh', ayahs:4, juz:30 },
  { num:107, name:'الماعون', en:'Al-Ma\'un', ayahs:7, juz:30 },
  { num:108, name:'الكوثر', en:'Al-Kawthar', ayahs:3, juz:30 },
  { num:109, name:'الكافرون', en:'Al-Kafirun', ayahs:6, juz:30 },
  { num:110, name:'النصر', en:'An-Nasr', ayahs:3, juz:30 },
  { num:111, name:'المسد', en:'Al-Masad', ayahs:5, juz:30 },
  { num:112, name:'الإخلاص', en:'Al-Ikhlas', ayahs:4, juz:30 },
  { num:113, name:'الفلق', en:'Al-Falaq', ayahs:5, juz:30 },
  { num:114, name:'الناس', en:'An-Nas', ayahs:6, juz:30 },
]

// 30-cu cüzün surələri (Nəbə — Nas)
const AMMA = SURAHS.filter(s => s.num >= 78)

// ═══════════════════════════════════════════════════════
// AĞILLI HİFZ — aralıqlı təkrar (utils/hifzSrs.js), gizlət/aç məşqi,
// səs müqayisəsi (qari ↔ istifadəçinin yazısı) və təxmini avtomatik yoxlama.
// Yaddaş: 'hifz_srs' (yeni açar). Köhnə 'hifz_progress' olduğu kimi qalır və
// SRS-də qiymət veriləndə yalnız YÜKSƏLDİLİR (0 → 1 → 2), heç vaxt endirilmir.
// Səs yazısı yalnız yaddaşdadır (Blob URL), heç yerə göndərilmir.
// ═══════════════════════════════════════════════════════
const SMART = {
  az: {
    smartEyebrow:'Ağıllı hifz', smartTitle:'Bu günün planı', smartLead:'Hər ayəni oxuduqdan sonra özünüzə qiymət verin — növbəti təkrarın vaxtını sayt özü planlaşdıracaq.',
    due:'Bu gün təkrar', learned:'Bu gün yeni', streak:'Ardıcıllıq', total:'Siyahıda',
    goal:'Gündəlik hədəf', goalDec:'Hədəfi azalt', goalInc:'Hədəfi artır', goalUnit:'yeni ayə',
    startReview:'Təkrara başla', noDue:'Bu gün təkrar ediləcək ayə yoxdur',
    learnTitle:'Yeni ayə əzbərlə', surah:'Surə', fromAyah:'Başlanğıc ayə', learnBtn:'Əzbərləməyə başla', surahAllIn:'Bu surənin bütün ayələri artıq siyahıdadır',
    seedText:'Əzbər işarələnmiş surələrdə təkrar siyahısına düşməmiş ayələr: {n}.', seedBtn:'Təkrar siyahısına əlavə et',
    review:'Təkrar', learn:'Yeni ayə', ayah:'Ayə', close:'Sessiyanı bağla',
    view:'Mətn görünüşü', viewFull:'Tam mətn', viewFirst:'İlk söz', viewBlur:'Gizli mətn',
    revealNext:'Növbəti söz', revealAll:'Hamısını göstər', hideAll:'Yenidən gizlət', tapHint:'Gizli sözü açmaq üçün ona toxunun', hiddenWord:'Gizli söz, açmaq üçün toxunun',
    compare:'Səs müqayisəsi', reciter:'Qari', you:'Sizin qiraətiniz', record:'Yazmağa başla', stopRec:'Yazını bitir', recAgain:'Yenidən yaz', noRec:'Hələ yazı yoxdur',
    recNote:'Yazı yalnız bu səhifənin yaddaşında qalır, heç yerə göndərilmir.', micDenied:'Mikrofona icazə verilmədi',
    gradeQ:'Necə oxudunuz?', again:'Yenidən', hard:'Çətin', good:'Yaxşı', easy:'Asan', now:'bu gün',
    doneTitle:'Sessiya bitdi', doneText:'Verilən qiymət: {n}. Allah bərəkət versin!',
    loading:'Ayə yüklənir…', loadError:'Ayəni yükləmək alınmadı', retry:'Yenidən cəhd et',
    chartTitle:'Əzbərlənən ayələr', chartSub:'son 30 gündə', chartEmpty:'Qrafik ilk qiymətdən sonra görünəcək.', date:'Tarix', count:'Ayə sayı',
    bars:'Surələr üzrə irəliləyiş', barsEmpty:'Hələ heç bir surəyə başlanmayıb.', trackerTitle:'Surə izləyicisi',
  },
  en: {
    smartEyebrow:'Smart hifz', smartTitle:'Today’s plan', smartLead:'Grade yourself after reciting each ayah — the site schedules the next review for you.',
    due:'Today’s reviews', learned:'New today', streak:'Streak', total:'In your list',
    goal:'Daily goal', goalDec:'Decrease goal', goalInc:'Increase goal', goalUnit:'new ayahs',
    startReview:'Start review', noDue:'No ayahs to review today',
    learnTitle:'Memorize new ayahs', surah:'Surah', fromAyah:'Starting ayah', learnBtn:'Start memorizing', surahAllIn:'All ayahs of this surah are already in your list',
    seedText:'Ayahs from surahs marked memorized that are not yet in your review list: {n}.', seedBtn:'Add to reviews',
    review:'Review', learn:'New ayah', ayah:'Ayah', close:'Close session',
    view:'Text view', viewFull:'Full text', viewFirst:'First word', viewBlur:'Hidden text',
    revealNext:'Next word', revealAll:'Show all', hideAll:'Hide again', tapHint:'Tap a hidden word to reveal it', hiddenWord:'Hidden word, tap to reveal',
    compare:'Voice comparison', reciter:'Reciter', you:'Your recitation', record:'Start recording', stopRec:'Stop recording', recAgain:'Record again', noRec:'No recording yet',
    recNote:'The recording stays only in this page’s memory and is never uploaded.', micDenied:'Microphone access was denied',
    gradeQ:'How did you recite?', again:'Again', hard:'Hard', good:'Good', easy:'Easy', now:'today',
    doneTitle:'Session complete', doneText:'Grades given: {n}. May Allah bless you!',
    loading:'Loading ayah…', loadError:'Could not load the ayah', retry:'Try again',
    chartTitle:'Ayahs memorized', chartSub:'last 30 days', chartEmpty:'The chart appears after your first grade.', date:'Date', count:'Ayahs',
    bars:'Progress by surah', barsEmpty:'No surah started yet.', trackerTitle:'Surah tracker',
  },
  ru: {
    smartEyebrow:'Умный хифз', smartTitle:'План на сегодня', smartLead:'После чтения каждого аята оцените себя — сайт сам запланирует следующее повторение.',
    due:'Повторить сегодня', learned:'Новых сегодня', streak:'Серия', total:'В списке',
    goal:'Дневная цель', goalDec:'Уменьшить цель', goalInc:'Увеличить цель', goalUnit:'новых аятов',
    startReview:'Начать повторение', noDue:'Сегодня нет аятов для повторения',
    learnTitle:'Выучить новые аяты', surah:'Сура', fromAyah:'С аята', learnBtn:'Начать заучивание', surahAllIn:'Все аяты этой суры уже в списке',
    seedText:'Аятов из выученных сур, которых ещё нет в списке повторения: {n}.', seedBtn:'Добавить в повторение',
    review:'Повторение', learn:'Новый аят', ayah:'Аят', close:'Закрыть сессию',
    view:'Вид текста', viewFull:'Весь текст', viewFirst:'Первое слово', viewBlur:'Скрытый текст',
    revealNext:'Следующее слово', revealAll:'Показать всё', hideAll:'Скрыть снова', tapHint:'Нажмите на скрытое слово, чтобы открыть его', hiddenWord:'Скрытое слово, нажмите, чтобы открыть',
    compare:'Сравнение чтения', reciter:'Чтец', you:'Ваше чтение', record:'Начать запись', stopRec:'Остановить запись', recAgain:'Записать заново', noRec:'Записи пока нет',
    recNote:'Запись хранится только в памяти этой страницы и никуда не отправляется.', micDenied:'Нет доступа к микрофону',
    gradeQ:'Как вы прочитали?', again:'Снова', hard:'Трудно', good:'Хорошо', easy:'Легко', now:'сегодня',
    doneTitle:'Сессия завершена', doneText:'Оценок: {n}. Да благословит вас Аллах!',
    loading:'Загрузка аята…', loadError:'Не удалось загрузить аят', retry:'Повторить',
    chartTitle:'Выученные аяты', chartSub:'за последние 30 дней', chartEmpty:'График появится после первой оценки.', date:'Дата', count:'Аятов',
    bars:'Прогресс по сурам', barsEmpty:'Пока ни одна сура не начата.', trackerTitle:'Трекер сур',
  },
  ar: {
    smartEyebrow:'الحفظ الذكي', smartTitle:'خطة اليوم', smartLead:'بعد تلاوة كل آية قيّم قراءتك، وسيجدول الموقع موعد المراجعة التالية.',
    due:'مراجعة اليوم', learned:'جديد اليوم', streak:'أيام متتالية', total:'في القائمة',
    goal:'الهدف اليومي', goalDec:'إنقاص الهدف', goalInc:'زيادة الهدف', goalUnit:'آيات جديدة',
    startReview:'ابدأ المراجعة', noDue:'لا توجد آيات للمراجعة اليوم',
    learnTitle:'حفظ آيات جديدة', surah:'السورة', fromAyah:'من الآية', learnBtn:'ابدأ الحفظ', surahAllIn:'جميع آيات هذه السورة في القائمة بالفعل',
    seedText:'آيات من السور المحفوظة ليست في قائمة المراجعة بعد: {n}.', seedBtn:'أضفها إلى المراجعة',
    review:'مراجعة', learn:'آية جديدة', ayah:'الآية', close:'إغلاق الجلسة',
    view:'طريقة العرض', viewFull:'النص كاملًا', viewFirst:'الكلمة الأولى', viewBlur:'نص مخفي',
    revealNext:'الكلمة التالية', revealAll:'إظهار الكل', hideAll:'إخفاء من جديد', tapHint:'اضغط على الكلمة المخفية لإظهارها', hiddenWord:'كلمة مخفية، اضغط لإظهارها',
    compare:'مقارنة التلاوة', reciter:'القارئ', you:'تلاوتك', record:'ابدأ التسجيل', stopRec:'أوقف التسجيل', recAgain:'سجّل من جديد', noRec:'لا يوجد تسجيل بعد',
    recNote:'يبقى التسجيل في ذاكرة هذه الصفحة فقط ولا يُرسل إلى أي مكان.', micDenied:'لم يُسمح باستخدام الميكروفون',
    gradeQ:'كيف كانت تلاوتك؟', again:'أعد', hard:'صعب', good:'جيد', easy:'سهل', now:'اليوم',
    doneTitle:'انتهت الجلسة', doneText:'عدد التقييمات: {n}. بارك الله فيك!',
    loading:'جارٍ تحميل الآية…', loadError:'تعذّر تحميل الآية', retry:'إعادة المحاولة',
    chartTitle:'الآيات المحفوظة', chartSub:'آخر 30 يومًا', chartEmpty:'يظهر الرسم بعد أول تقييم.', date:'التاريخ', count:'عدد الآيات',
    bars:'التقدم حسب السور', barsEmpty:'لم تبدأ أي سورة بعد.', trackerTitle:'متابعة السور',
  },
  tr: {
    smartEyebrow:'Akıllı hıfz', smartTitle:'Bugünün planı', smartLead:'Her ayeti okuduktan sonra kendinize not verin; bir sonraki tekrarın zamanını site kendisi planlar.',
    due:'Bugün tekrar', learned:'Bugün yeni', streak:'Seri', total:'Listede',
    goal:'Günlük hedef', goalDec:'Hedefi azalt', goalInc:'Hedefi artır', goalUnit:'yeni ayet',
    startReview:'Tekrara başla', noDue:'Bugün tekrar edilecek ayet yok',
    learnTitle:'Yeni ayet ezberle', surah:'Sure', fromAyah:'Başlangıç ayeti', learnBtn:'Ezberlemeye başla', surahAllIn:'Bu surenin tüm ayetleri zaten listede',
    seedText:'Ezberlendi olarak işaretlenen surelerden tekrar listesinde olmayan ayetler: {n}.', seedBtn:'Tekrar listesine ekle',
    review:'Tekrar', learn:'Yeni ayet', ayah:'Ayet', close:'Oturumu kapat',
    view:'Metin görünümü', viewFull:'Tam metin', viewFirst:'İlk kelime', viewBlur:'Gizli metin',
    revealNext:'Sonraki kelime', revealAll:'Tümünü göster', hideAll:'Yeniden gizle', tapHint:'Gizli kelimeyi açmak için ona dokunun', hiddenWord:'Gizli kelime, açmak için dokunun',
    compare:'Ses karşılaştırması', reciter:'Kari', you:'Sizin okuyuşunuz', record:'Kayda başla', stopRec:'Kaydı bitir', recAgain:'Yeniden kaydet', noRec:'Henüz kayıt yok',
    recNote:'Kayıt yalnızca bu sayfanın belleğinde kalır, hiçbir yere gönderilmez.', micDenied:'Mikrofon izni verilmedi',
    gradeQ:'Nasıl okudunuz?', again:'Yeniden', hard:'Zor', good:'İyi', easy:'Kolay', now:'bugün',
    doneTitle:'Oturum bitti', doneText:'Verilen not: {n}. Allah bereketli kılsın!',
    loading:'Ayet yükleniyor…', loadError:'Ayet yüklenemedi', retry:'Tekrar dene',
    chartTitle:'Ezberlenen ayetler', chartSub:'son 30 günde', chartEmpty:'Grafik ilk değerlendirmeden sonra görünecek.', date:'Tarih', count:'Ayet sayısı',
    bars:'Surelere göre ilerleme', barsEmpty:'Henüz hiçbir sureye başlanmadı.', trackerTitle:'Sure takibi',
  },
}

// Gün sözü rəqəmə uyğun (Intl.PluralRules kateqoriyaları)
const DAY_WORDS = {
  az: 'gün', // lang-ok: az və tr-də söz eynidir
  en: { zero: 'days', one: 'day', two: 'days', few: 'days', many: 'days', other: 'days' },
  ru: { zero: 'дней', one: 'день', two: 'дня', few: 'дня', many: 'дней', other: 'дня' },
  ar: { zero: 'يوم', one: 'يوم', two: 'يومان', few: 'أيام', many: 'يومًا', other: 'يوم' },
  tr: 'gün', // lang-ok: az və tr-də söz eynidir
}
const LOCALES = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar', tr: 'tr-TR' }
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// ── Surə mətni (alquran.cloud, Quran səhifəsi ilə eyni nəşr: ar.alafasy) ──
// Modul səviyyəsində keş: eyni surə bir dəfə gətirilir; xəta keşdə qalmır.
const SURAH_CACHE = new Map()
function fetchSurahText(s) {
  if (SURAH_CACHE.has(s)) return SURAH_CACHE.get(s)
  const p = fetch(`https://api.alquran.cloud/v1/surah/${s}/editions/ar.alafasy`)
    .then(r => { if (!r.ok) throw new Error('http'); return r.json() })
    .then(d => {
      const ed = Array.isArray(d?.data) ? d.data[0] : null
      if (!Array.isArray(ed?.ayahs)) throw new Error('bad-response')
      return ed.ayahs.map((v, i) => ({ a: v.numberInSurah, g: v.number, ar: displayAyah(v.text, s, i) }))
    })
  SURAH_CACHE.set(s, p)
  p.catch(() => SURAH_CACHE.delete(s))
  return p
}
function useAyah(s, a, attempt) {
  const [st, setSt] = useState({ verse: null, loading: true, error: false })
  useEffect(() => {
    let off = false
    setSt({ verse: null, loading: true, error: false })
    fetchSurahText(s)
      .then(list => { if (!off) { const v = list.find(x => x.a === a); setSt({ verse: v || null, loading: false, error: !v }) } })
      .catch(() => { if (!off) setSt({ verse: null, loading: false, error: true }) })
    return () => { off = true }
  }, [s, a, attempt])
  return st
}

// ── Brauzer imkanları (yalnız müştəridə; prerender-də hamısı yox sayılır) ──
// Avtomatik nitq tanıma QƏSDƏN yoxdur: brauzer (Chrome) səsi öz serverinə
// göndərir — sayt sahibinin qərarı ilə çıxarılıb. Yazı yalnız cihazda qalır.
function useCapabilities() {
  const [caps, setCaps] = useState({ record: false })
  useEffect(() => {
    setCaps({ record: !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder) })
  }, [])
  return caps
}

// ── Məşq kartı: bir ayə ── (key ilə hər ayədə sıfırlanır)
function PracticeCard({ item, srsItem, kind, pos, total, view, setView, lang, onGrade, onClose, today }) {
  const sm = pickUi(SMART, lang)
  const [attempt, setAttempt] = useState(0)
  const { verse, loading, error } = useAyah(item.s, item.a, attempt)
  const words = useMemo(() => (verse ? splitAyahWords(verse.ar) : []), [verse])
  const caps = useCapabilities()
  const [suggest, setSuggest] = useState(null)   // tapmacanın təklif etdiyi qiymət
  useEffect(() => { setSuggest(null) }, [view, verse])

  // Gizlət/aç: açılmış söz indeksləri
  const [shown, setShown] = useState(() => new Set())
  useEffect(() => { setShown(view === 'first' ? new Set([0]) : new Set()) }, [view, verse])
  const isShown = i => view === 'full' || shown.has(i)
  const hiddenLeft = view === 'full' ? 0 : words.filter((_, i) => !shown.has(i)).length
  const revealOne = i => setShown(prev => new Set(prev).add(i))
  const revealNext = () => { const i = words.findIndex((_, k) => !shown.has(k)); if (i >= 0) revealOne(i) }
  const revealAll = () => setShown(new Set(words.map((_, i) => i)))
  const hideAll = () => setShown(view === 'first' ? new Set([0]) : new Set())

  // Qari səsi: əsas mənbə xəta versə ehtiyata keçir (utils/quranAudio.js)
  const reciter = useMemo(() => readAudioPrefs().reciter, [])
  const sources = verse ? ayahSources(reciter, { g: verse.g, s: item.s, a: item.a }) : []
  const [srcIdx, setSrcIdx] = useState(0)

  // İstifadəçinin yazısı — yalnız yaddaşda
  const recRef = useRef(null)
  const urlRef = useRef(null)
  const [recUrl, setRecUrl] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recErr, setRecErr] = useState(false)
  const startRec = async () => {
    setRecErr(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks = []
      mr.ondataavailable = e => { if (e.data?.size) chunks.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach(tr => tr.stop())
        if (!chunks.length || recRef.current !== mr) return
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        urlRef.current = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' }))
        setRecUrl(urlRef.current)
      }
      recRef.current = mr
      mr.start()
      setRecording(true)
    } catch { setRecErr(true); setRecording(false) }
  }
  const stopRec = () => { try { recRef.current?.stop() } catch { /* artıq dayanıb */ } setRecording(false) }

  // Təxmini avtomatik yoxlama (Web Speech API, ar-SA)
  // Kart bağlananda: yazını dayandır, Blob URL-i burax
  useEffect(() => () => {
    const mr = recRef.current; recRef.current = null
    try { if (mr && mr.state !== 'inactive') mr.stop() } catch { /* artıq dayanıb */ }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [])

  const preview = previewIntervals(srsItem || newItem(item.s, item.a, today))
  const dayText = n => (n === 0 ? sm.now : `${n} ${pluralWord(n, lang, DAY_WORDS)}`)
  const surahName = lang === 'ar' ? SURAHS[item.s - 1].name : (getSurahLocal(item.s, lang)?.name || SURAHS[item.s - 1].en)

  return (
    <article className="hifz-practice ui-card" aria-labelledby="hifz-practice-title">
      <header className="hifz-practice__head">
        <div className="hifz-practice__heading">
          <span className={`ui-badge${kind === 'review' ? ' ui-badge--brand' : ''}`}>{kind === 'review' ? sm.review : sm.learn}</span>
          <h3 id="hifz-practice-title" className="hifz-practice__title">{surahName} · {sm.ayah} {item.a}</h3>
        </div>
        <span className="hifz-practice__pos ui-num"><bdi dir="ltr">{pos} / {total}</bdi></span>
        <button type="button" className="ui-icon-btn" aria-label={sm.close} onClick={onClose}><Icon name="close" /></button>
      </header>

      <div className="hifz-practice__views" role="group" aria-label={sm.view}>
        {[['full', sm.viewFull], ['first', sm.viewFirst], ['blur', sm.viewBlur], ['puzzle', pickUi(PUZZLE_LABEL, lang)]].map(([v, label]) => (
          <button type="button" key={v} className="ui-chip" aria-pressed={view === v} onClick={() => setView(v)} data-testid={`hifz-view-${v}`}>{label}</button>
        ))}
      </div>

      {loading && <p className="hifz-practice__status" role="status"><span className="ui-spin" aria-hidden="true" /> {sm.loading}</p>}
      {error && (
        <div className="hifz-practice__status" role="alert">
          <span>{sm.loadError}</span>
          <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => setAttempt(n => n + 1)}>{sm.retry}</button>
        </div>
      )}

      {verse && view === 'puzzle' && (
        <Suspense fallback={<div style={{ minHeight: 220 }} />}>
          <AyahPuzzle words={words} ayah={item.a} lang={lang} onDone={({ grade }) => setSuggest(grade)} />
        </Suspense>
      )}
      {verse && view !== 'puzzle' && (
        <>
          <p className="hifz-ayah ui-arabic" lang="ar" dir="rtl">
            {words.map((w, i) => {
              return isShown(i)
                ? <span key={i} className="hifz-word">{w}</span>
                : <button type="button" key={i} className="hifz-word is-hidden" onClick={() => revealOne(i)} aria-label={sm.hiddenWord}>{w}</button>
            })}
            <span className="hifz-ayah__num ui-num" aria-hidden="true">﴿{item.a}﴾</span>
          </p>
          {view !== 'full' && (
            <div className="hifz-practice__reveal">
              <span className="hifz-practice__hint">{sm.tapHint}</span>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={revealNext} disabled={!hiddenLeft}>{sm.revealNext}</button>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={hiddenLeft ? revealAll : hideAll}>
                {hiddenLeft ? sm.revealAll : sm.hideAll}
              </button>
            </div>
          )}

          {/* Səs müqayisəsi: qari və istifadəçi yan-yana */}
          <section className="hifz-voice" aria-label={sm.compare}>
            <div className="hifz-voice__col">
              <span className="hifz-voice__label"><Icon name="volume" size={16} /> {sm.reciter} — {reciterName(reciter, lang)}</span>
              {sources[srcIdx] && (
                <audio key={srcIdx} className="hifz-voice__audio" controls preload="none" src={sources[srcIdx]}
                  onError={() => setSrcIdx(i => (i + 1 < sources.length ? i + 1 : i))} />
              )}
            </div>
            {caps.record && (
              <div className="hifz-voice__col">
                <span className="hifz-voice__label"><Icon name="mic" size={16} /> {sm.you}</span>
                {recUrl ? <audio className="hifz-voice__audio" controls src={recUrl} /> : <span className="hifz-voice__empty">{sm.noRec}</span>}
                <button type="button" className={`ui-btn ui-btn--sm ${recording ? 'ui-btn--primary' : 'ui-btn--secondary'}`}
                  onClick={recording ? stopRec : startRec} aria-pressed={recording}>
                  <Icon name={recording ? 'pause' : 'mic'} className="ui-btn__icon" />
                  {recording ? sm.stopRec : recUrl ? sm.recAgain : sm.record}
                </button>
                {recErr && <span className="hifz-voice__err" role="alert">{sm.micDenied}</span>}
              </div>
            )}
          </section>
          {caps.record && <p className="hifz-note"><Icon name="shield" size={14} /> {sm.recNote}</p>}

        </>
      )}

      {/* Qiymət: dörd düymə, altında növbəti təkrarın vaxtı */}
      <div className="hifz-grade">
        <span className="hifz-grade__q">{sm.gradeQ}</span>
        <div className="hifz-grade__btns">
          {GRADES.map(g => (
            <button type="button" key={g} className={`ui-btn ui-btn--secondary hifz-grade__btn is-${g}${suggest === g ? ' is-suggested' : ''}`} disabled={!verse}
              onClick={() => onGrade(g)}>
              <span>{sm[g]}</span>
              <span className="hifz-grade__when">{dayText(preview[g])}</span>
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}

// ── Qrafik: son 30 gündə yığılan əzbər ayələri (tək seriya: sahə + xətt) ──
function ProgressChart({ series, lang, sm }) {
  const [hover, setHover] = useState(null)
  const W = 600, H = 160, PAD_T = 12, PAD_B = 8
  const max = Math.max(1, ...series.map(p => p.count))
  const x = i => (series.length > 1 ? (i / (series.length - 1)) * W : W / 2)
  const y = c => PAD_T + (1 - c / max) * (H - PAD_T - PAD_B)
  const line = series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.count).toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H - PAD_B} L0,${H - PAD_B} Z`
  const fmt = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString(LOCALES[lang] || 'en-GB', { day: '2-digit', month: '2-digit' }) } catch { return d } }
  const last = series[series.length - 1]?.count ?? 0
  const h = hover != null ? series[hover] : null

  return (
    <figure className="hifz-chart ui-card">
      <figcaption className="hifz-chart__head">
        <span className="hifz-chart__title">{sm.chartTitle}</span>
        <span className="hifz-chart__sub">{sm.chartSub}</span>
        <span className="hifz-chart__now ui-num">{last}</span>
      </figcaption>
      {last === 0 ? <p className="hifz-chart__empty">{sm.chartEmpty}</p> : (
        <div className="hifz-chart__plot" dir="ltr" onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <line className="hifz-chart__base" x1="0" x2={W} y1={H - PAD_B} y2={H - PAD_B} vectorEffect="non-scaling-stroke" />
            <path className="hifz-chart__area" d={area} />
            <path className="hifz-chart__line" d={line} vectorEffect="non-scaling-stroke" />
            {h && <line className="hifz-chart__cross" x1={x(hover)} x2={x(hover)} y1={0} y2={H - PAD_B} vectorEffect="non-scaling-stroke" />}
            {series.map((p, i) => (
              <rect key={p.date} x={x(i) - W / series.length / 2} y="0" width={W / series.length} height={H}
                fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
            ))}
          </svg>
          {h && (
            <span className="hifz-chart__tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(h.count) / H) * 100}%` }}>
              <span className="hifz-chart__dot" />
              <span className="hifz-chart__tipbox"><b className="ui-num">{h.count}</b> · {fmt(h.date)}</span>
            </span>
          )}
          <div className="hifz-chart__axis"><span>{fmt(series[0].date)}</span><span>{fmt(series[series.length - 1].date)}</span></div>
        </div>
      )}
      {/* Cədvəl görünüşü — ekran oxuyucusu üçün */}
      <table className="ui-sr-only">
        <caption>{sm.chartTitle} — {sm.chartSub}</caption>
        <thead><tr><th scope="col">{sm.date}</th><th scope="col">{sm.count}</th></tr></thead>
        <tbody>{series.map(p => <tr key={p.date}><td>{fmt(p.date)}</td><td>{p.count}</td></tr>)}</tbody>
      </table>
    </figure>
  )
}

// ── Ağıllı hifz bölməsi ──
function SmartHifz({ lang, progress, setProgress, srs, setSrs }) {
  const sm = pickUi(SMART, lang)
  const G = HIFZ_GUIDE.queue
  const today = dateKey()
  const stats = todayStats(srs, today)
  const days = streak(srs, today)
  const counts = useMemo(() => perSurahCounts(srs), [srs])
  const series = useMemo(() => memorisedSeries(srs, today, 30), [srs, today])

  const [session, setSession] = useState(null) // { kind, queue: [{s,a}], idx, graded }
  const [view, setView] = useState('first')
  const [pick, setPick] = useState(() => {
    const inProg = SURAHS.find(s => progress[s.num] === 1)
    return inProg ? inProg.num : 1
  })
  const [from, setFrom] = useState(1)
  const [msg, setMsg] = useState('')
  const sessionRef = useRef(null)
  const pickMax = SURAHS[pick - 1].ayahs
  const sessionId = session?.id

  useEffect(() => {
    if (sessionId && sessionRef.current?.scrollIntoView) sessionRef.current.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' })
  }, [sessionId])

  const startReview = () => {
    const queue = dueItems(srs, today).map(({ s, a }) => ({ s, a }))
    if (queue.length) { setMsg(''); setSession({ id: Date.now(), kind: 'review', queue, idx: 0, graded: 0 }) }
  }
  const startLearn = () => {
    const limit = stats.goalLeft || stats.goal
    const queue = nextNewAyahs(srs, pick, pickMax, Math.min(Math.max(1, from), pickMax), limit)
    if (!queue.length) { setMsg(sm.surahAllIn); return }
    setMsg('')
    setSession({ id: Date.now(), kind: 'learn', queue, idx: 0, graded: 0 })
  }
  const onGrade = (grade) => {
    if (!session) return
    haptic()
    const cur = session.queue[session.idx]
    const next = gradeItem(srs, cur.s, cur.a, grade, today)
    setSrs(next)
    // Köhnə izləyici ilə əlaqə: surə statusu yalnız yüksəlir
    const have = perSurahCounts(next)[cur.s] || 0
    const want = have >= SURAHS[cur.s - 1].ayahs ? 2 : 1
    setProgress(prev => ((prev[cur.s] || 0) >= want ? prev : { ...prev, [cur.s]: want }))
    setSession(sess => ({
      ...sess,
      queue: grade === 'again' ? [...sess.queue, cur] : sess.queue,
      idx: sess.idx + 1,
      graded: sess.graded + 1,
    }))
  }

  // Köhnə izləyicidə "əzbər" olan surələrin hələ siyahıda olmayan ayələri
  const seedRefs = useMemo(() => {
    const refs = []
    for (const s of SURAHS) {
      if (progress[s.num] !== 2 || (counts[s.num] || 0) >= s.ayahs) continue
      for (let a = 1; a <= s.ayahs; a++) if (!srs.items[`${s.num}:${a}`]) refs.push({ s: s.num, a })
    }
    return refs
  }, [progress, counts, srs.items])
  const seed = () => setSrs(prev => seedItems(prev, seedRefs, today))

  const localName = s => (lang === 'ar' ? s.name : (getSurahLocal(s.num, lang)?.name || s.en))
  // Növbə: vaxtı çatmış ilk 6 ayə + gələn 7 günün təkrar proqnozu (gecikmişlər bu günə düşür)
  const due = useMemo(() => dueItems(srs, today), [srs, today])
  const forecast = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
    const counts = days.map(() => 0)
    for (const it of Object.values(srs.items)) {
      const k = it.due <= today ? 0 : days.indexOf(it.due)
      if (k >= 0) counts[k]++
    }
    const wd = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString(LOCALES[lang] || 'en-GB', { weekday: 'short' }) } catch { return d.slice(5) } }
    return days.map((d, i) => ({ key: d, label: i === 0 ? pk(G.today, lang) : wd(d), value: counts[i], current: i === 0 }))
  }, [srs.items, today, lang, G.today])
  const hasForecast = forecast.some(d => d.value > 0)
  const barSurahs = SURAHS.filter(s => counts[s.num] || progress[s.num])
  const cur = session && session.idx < session.queue.length ? session.queue[session.idx] : null

  return (
    <section className="hifz-smart" id="hifz-plan" aria-labelledby="hifz-smart-title">
      <div className="ui-section-head" data-reveal="">
        <span className="ui-eyebrow">{sm.smartEyebrow}</span>
        <h2 id="hifz-smart-title" className="ui-title">{sm.smartTitle}</h2>
        <p className="ui-lead">{sm.smartLead}</p>
      </div>

      {/* Bu günün göstəriciləri */}
      <div className="hifz-today">
        <div className="hifz-today__cell is-due">
          <span className="hifz-today__num ui-num">{stats.due}</span>
          <span className="hifz-today__label">{sm.due}</span>
        </div>
        <div className="hifz-today__cell">
          <span className="hifz-today__num ui-num"><bdi dir="ltr">{stats.learned}<small> / {stats.goal}</small></bdi></span>
          <span className="hifz-today__label">{sm.learned}</span>
          <div className="hifz-progress-bar" role="progressbar" aria-label={sm.learned} aria-valuemin={0} aria-valuemax={stats.goal} aria-valuenow={Math.min(stats.learned, stats.goal)}>
            <div className="hifz-progress-fill" style={{ transform: `scaleX(${Math.min(1, stats.learned / stats.goal)})` }} />
          </div>
        </div>
        <div className="hifz-today__cell">
          <span className="hifz-today__num ui-num">{days}</span>
          <span className="hifz-today__label">{sm.streak} · {pluralWord(days, lang, DAY_WORDS)}</span>
        </div>
        <div className="hifz-today__cell">
          <span className="hifz-today__num ui-num">{stats.total}</span>
          <span className="hifz-today__label">{sm.total}</span>
        </div>
      </div>

      <div className="hifz-plan">
        <div className="hifz-plan__card ui-card">
          <h3 className="hifz-plan__title">{sm.due}</h3>
          {stats.due
            ? <button type="button" className="ui-btn ui-btn--primary hifz-start-review" onClick={startReview}>
                <Icon name="refresh" className="ui-btn__icon" />{sm.startReview}<span className="hifz-start-review__n ui-num">{stats.due}</span>
              </button>
            : <p className="hifz-plan__muted"><Icon name="check" size={16} /> {sm.noDue}</p>}
          {due.length > 0 && (
            <div className="hifz-queue">
              <span className="hifz-queue__title">{pk(G.title, lang)}</span>
              <ul className="hifz-queue__list">
                {due.slice(0, 6).map(it => (
                  <li key={`${it.s}:${it.a}`} className="hifz-queue__item">
                    <span className="hifz-queue__name">{localName(SURAHS[it.s - 1])}</span>
                    <span className="ui-num hifz-queue__ref" dir="ltr">{it.s}:{it.a}</span>
                  </li>
                ))}
                {due.length > 6 && <li className="hifz-queue__more ui-num">{pkf(G.more, lang, due.length - 6)}</li>}
              </ul>
            </div>
          )}
          {hasForecast && (
            <figure className="hifz-forecast">
              <figcaption className="hifz-queue__title">{pk(G.forecast, lang)} <span className="hifz-forecast__sub">· {pk(G.forecastSub, lang)}</span></figcaption>
              <ColumnChart data={forecast} height={84} label={pk(G.forecast, lang)} />
            </figure>
          )}
          {seedRefs.length > 0 && (
            <div className="hifz-seed">
              <p>{fill(sm.seedText, { n: seedRefs.length })}</p>
              <button type="button" className="ui-btn ui-btn--secondary ui-btn--sm" onClick={seed}><Icon name="plus" className="ui-btn__icon" />{sm.seedBtn}</button>
            </div>
          )}
        </div>

        <div className="hifz-plan__card ui-card">
          <h3 className="hifz-plan__title">{sm.learnTitle}</h3>
          <div className="hifz-plan__fields">
            <label className="ui-field hifz-plan__surah">
              <span className="ui-field__label">{sm.surah}</span>
              <select className="ui-select" value={pick} onChange={e => { setPick(Number(e.target.value)); setFrom(1); setMsg('') }}>
                {SURAHS.map(s => <option key={s.num} value={s.num}>{s.num}. {localName(s)}</option>)}
              </select>
            </label>
            <label className="ui-field hifz-plan__from">
              <span className="ui-field__label">{sm.fromAyah}</span>
              <input className="ui-input" type="number" inputMode="numeric" min={1} max={pickMax} value={from}
                onChange={e => setFrom(Math.min(pickMax, Math.max(1, Number(e.target.value) || 1)))} />
            </label>
          </div>
          <div className="hifz-goal">
            <span className="hifz-goal__label">{sm.goal}</span>
            <button type="button" className="ui-icon-btn" aria-label={sm.goalDec} onClick={() => setSrs(p => setGoal(p, p.goal - 1))} disabled={stats.goal <= GOAL_MIN}><Icon name="minus" /></button>
            <span className="hifz-goal__val ui-num" aria-live="polite">{stats.goal}</span>
            <button type="button" className="ui-icon-btn" aria-label={sm.goalInc} onClick={() => setSrs(p => setGoal(p, p.goal + 1))} disabled={stats.goal >= GOAL_MAX}><Icon name="plus" /></button>
            <span className="hifz-goal__unit">{sm.goalUnit}</span>
          </div>
          <button type="button" className="ui-btn ui-btn--secondary hifz-start-learn" onClick={startLearn}>
            <Icon name="hifz" className="ui-btn__icon" />{sm.learnBtn}
          </button>
          {msg && <p className="hifz-plan__muted" role="status">{msg}</p>}
        </div>
      </div>

      {session && (
        <div ref={sessionRef} className="hifz-session">
          {cur ? (
            <PracticeCard key={`${session.id}:${session.idx}`} item={cur} srsItem={srs.items[`${cur.s}:${cur.a}`]}
              kind={session.kind} pos={session.idx + 1} total={session.queue.length} view={view} setView={setView}
              lang={lang} onGrade={onGrade} onClose={() => setSession(null)} today={today} />
          ) : (
            <div className="hifz-done ui-card" role="status">
              <span className="ui-icon-tile" aria-hidden="true"><Icon name="check" /></span>
              <div className="hifz-done__body">
                <h3 className="hifz-done__title">{sm.doneTitle}</h3>
                <p>{fill(sm.doneText, { n: session.graded })}</p>
              </div>
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setSession(null)}>{sm.close}</button>
            </div>
          )}
        </div>
      )}

      <div className="hifz-insights">
        <ProgressChart series={series} lang={lang} sm={sm} />
        <div className="hifz-bars ui-card">
          <h3 className="hifz-chart__title">{sm.bars}</h3>
          {barSurahs.length === 0 ? <p className="hifz-chart__empty">{sm.barsEmpty}</p> : (
            <ul className="hifz-bars__list">
              {barSurahs.map(s => {
                const done = Math.min(s.ayahs, progress[s.num] === 2 ? s.ayahs : (counts[s.num] || 0))
                return (
                  <li key={s.num} className="hifz-bars__row">
                    <span className="hifz-bars__name"><span className="ui-num">{s.num}.</span> {localName(s)}</span>
                    <span className="hifz-bars__val ui-num"><bdi dir="ltr">{done} / {s.ayahs}</bdi></span>
                    <div className="hifz-progress-bar" role="progressbar" aria-label={localName(s)} aria-valuemin={0} aria-valuemax={s.ayahs} aria-valuenow={done}>
                      <div className="hifz-progress-fill" style={{ transform: `scaleX(${done / s.ayahs})` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

export default function HifzPage() {
  const { lang } = useLang()
  const t = pickUi(LABELS, lang)
  const sl = pickUi(STATUS_LABELS, lang)

  const [progress, setProgress] = useState(loadProgress)
  const [filter, setFilter] = useState('all') // all, memorized, inProgress, notStarted
  // Ağıllı hifzin vəziyyəti səhifə səviyyəsindədir — hero-dakı panel də onu göstərir
  const [srs, setSrs] = useState(() => loadSrs())
  useEffect(() => { saveSrs(srs) }, [srs])

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const getStatus = (num) => progress[num] || 0

  // Son toxunulan surə — kartda qısa "təsdiq" animasiyası (cüt/tək növbə ilə
  // eyni kartı ardıcıl basanda da animasiya yenidən oynayır)
  const [bump, setBump] = useState({ num: 0, n: 0 })

  const cycleStatus = (num) => {
    haptic()
    setBump(b => ({ num, n: b.n + 1 }))
    setProgress(prev => {
      const current = prev[num] || 0
      const next = (current + 1) % 3
      const updated = { ...prev }
      if (next === 0) delete updated[num]
      else updated[num] = next
      return updated
    })
  }

  const stats = useMemo(() => {
    let memorized = 0, inProg = 0, memAyahs = 0, progAyahs = 0
    SURAHS.forEach(s => {
      const st = progress[s.num] || 0
      if (st === 2) { memorized++; memAyahs += s.ayahs }
      if (st === 1) { inProg++; progAyahs += s.ayahs }
    })
    return { memorized, inProg, notStarted: 114 - memorized - inProg, memAyahs, progAyahs, pct: Math.round((memorized / 114) * 100) }
  }, [progress])

  const filtered = useMemo(() => {
    if (filter === 'all') return SURAHS
    const st = (num) => progress[num] || 0
    if (filter === 'memorized') return SURAHS.filter(s => st(s.num) === 2)
    if (filter === 'inProgress') return SURAHS.filter(s => st(s.num) === 1)
    return SURAHS.filter(s => st(s.num) === 0)
  }, [filter, progress])

  const handleReset = () => {
    if (window.confirm(t.confirmReset)) {
      setProgress({})
    }
  }

  const H = HIFZ_GUIDE.hero
  const counts = useMemo(() => perSurahCounts(srs), [srs])
  const memAyahs = memorisedAyahs(progress, counts)
  const ammaDone = AMMA.filter(s => progress[s.num] === 2).length
  const streakDays = streak(srs, dateKey())
  // Hero keçidləri: səhifədaxili hamar sürüşmə (ünvan dəyişmir)
  const jump = id => e => {
    if (!isPlainClick(e)) return
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' })
  }
  const statusClass = (st) => st === 2 ? 'memorized' : st === 1 ? 'in-progress' : 'not-started'
  // Surənin cari dildə adı: az/ru/tr — yerli yazılış (əvvəl hamısında
  // ingiliscə "Al-Baqarah" görünürdü), en — transliterasiya
  const localName = (s) => getSurahLocal(s.num, lang)?.name || s.en
  const hasProgress = stats.memorized + stats.inProg > 0

  return (
    <>
      {/* Kompakt hero (v3, --split): solda izah + keçidlər, sağda ümumi irəliləyiş paneli */}
      <header className="ui-page-hero ui-page-hero--split hifz-hero">
        <div className="ui-pattern ui-pattern--fade" aria-hidden="true" />
        <div className="ui-container">
          <div className="ui-page-hero__text">
            <span className="ui-eyebrow">{navGroupLabel('quran', lang)}</span>
            <h1 className="ui-display">{t.title}</h1>
            <p className="ui-lead">{pk(H.lead, lang)}</p>
            <p className="ui-page-hero__how"><Icon name="info" size={16} />{pk(H.how, lang)}</p>
            <div className="ui-page-hero__actions">
              <a className="ui-btn ui-btn--primary ui-btn--sm" href="#hifz-plan" onClick={jump('hifz-plan')}>
                <Icon name="target" className="ui-btn__icon" />{pk(H.toPlan, lang)}
              </a>
              <a className="ui-btn ui-btn--secondary ui-btn--sm" href="#hifz-method" onClick={jump('hifz-method')}>
                <Icon name="learn" className="ui-btn__icon" />{pk(H.toMethod, lang)}
              </a>
            </div>
          </div>
          <div className="ui-page-hero__aside">
            <section className="hifz-dash" aria-label={pk(H.overall, lang)}>
              <ProgressRing value={ammaDone} max={AMMA.length} size={88} thickness={8} tone={2}
                label={pk(H.amma, lang)} sub={`${ammaDone} / ${AMMA.length} ${t.surahCount}`} />
              <div className="hifz-dash__side">
                <div className="hifz-dash__amma">
                  <span className="hifz-dash__label">{pk(H.overall, lang)}</span>
                  <span className="ui-num hifz-dash__val" dir="ltr">{memAyahs > 0 && memAyahs < 63 ? '<1' : Math.round((memAyahs / QURAN_AYAHS) * 100)}%</span>
                  <ProgressBar value={memAyahs} max={QURAN_AYAHS} label={pk(H.overall, lang)} />
                  <span className="hifz-dash__sub">{pkf(H.ayahsOf, lang, memAyahs)}</span>
                </div>
                <dl className="ui-kv hifz-dash__kv">
                  <div><dt>{pk(H.surahsDone, lang)}</dt><dd className="ui-num" data-count={stats.memorized}>{stats.memorized}</dd></div>
                  <div><dt>{pk(H.streak, lang)}</dt><dd className="ui-num" data-count={streakDays}>{streakDays}</dd></div>
                </dl>
              </div>
              <p className="hifz-dash__note">{pk(H.note, lang)}</p>
            </section>
          </div>
        </div>
      </header>

      <div className="ui-section hifz-section">
        <div className="ui-container hifz-layout">

          {/* Ağıllı hifz: bu günün planı, növbə, məşq, qrafik */}
          <QuranMap progress={progress} srsItems={srs.items} lang={lang}
            surahName={(n) => (lang === 'ar' ? SURAHS[n - 1].name : (getSurahLocal(n, lang)?.name || SURAHS[n - 1].en))}
            surahHref={(n) => pathFor('quran', lang, n)} />
          <SmartHifz lang={lang} progress={progress} setProgress={setProgress} srs={srs} setSrs={setSrs} />
        </div>
      </div>

      {/* viz v2: analitika — təkrar/yeni ayə dinamikası, temp və bitmə tarixi */}
      <HifzInsights srs={srs} progress={progress} surahs={SURAHS} counts={counts} memAyahs={memAyahs} lang={lang} />

      {/* Surə izləyicisi */}
      <section className="ui-section ui-section--alt hifz-tracker" aria-labelledby="hifz-tracker-title">
        <div className="ui-container hifz-layout">
          <div className="ui-section-head" data-reveal="">
            <span className="ui-eyebrow">{pk(HIFZ_GUIDE.tracker.eyebrow, lang)}</span>
            <h2 id="hifz-tracker-title" className="ui-title">{(pickUi(SMART, lang)).trackerTitle}</h2>
            <p className="ui-lead">{pk(HIFZ_GUIDE.tracker.lead, lang)}</p>
          </div>

          <div className="hifz-summary">
          {/* Xülasə paneli: faiz + zolaq (əsas) və üç status sətri.
              Zolaq scaleX ilə dolur (yalnız transform) */}
          <div className="hifz-stats" data-reveal="stagger">
            <div className="hifz-stat-card progress-card">
              <span className="hifz-stat-label">{t.progress}</span>
              <span className="hifz-stat-num ui-num">{stats.pct}%</span>
              <span className="hifz-stat-ayahs">{t.ofTotal.replace('{n}', stats.memorized)}</span>
              <div className="hifz-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats.pct} aria-label={t.progress}>
                <div className="hifz-progress-fill" style={{ transform: `scaleX(${stats.pct / 100})` }} />
              </div>
            </div>
            <div className="hifz-stat-card memorized">
              <span className="hifz-stat-num ui-num">{stats.memorized}</span>
              <span className="hifz-stat-label">{t.memorized}</span>
              <span className="hifz-stat-ayahs">{ayahCountText(stats.memAyahs, lang, HIFZ_AYAH_WORDS)}</span>
            </div>
            <div className="hifz-stat-card in-progress">
              <span className="hifz-stat-num ui-num">{stats.inProg}</span>
              <span className="hifz-stat-label">{t.inProgress}</span>
              <span className="hifz-stat-ayahs">{ayahCountText(stats.progAyahs, lang, HIFZ_AYAH_WORDS)}</span>
            </div>
            <div className="hifz-stat-card not-started">
              <span className="hifz-stat-num ui-num">{stats.notStarted}</span>
              <span className="hifz-stat-label">{t.notStarted}</span>
            </div>
          </div>
          <figure className="hifz-donut">
            <figcaption className="ui-sr-only">{pk(HIFZ_GUIDE.tracker.donut, lang)}</figcaption>
            <Donut size={120} thickness={14} label={pk(HIFZ_GUIDE.tracker.donut, lang)}
              segments={[
                { label: t.memorized, value: stats.memorized, tone: 1 },
                { label: t.inProgress, value: stats.inProg, tone: 2 },
                { label: t.notStarted, value: stats.notStarted, tone: 'muted' },
              ]}
              center={{ value: `${stats.pct}%`, label: t.progress }} />
          </figure>
          </div>

          {/* Süzgəc çipləri (say nişanı ilə) + Sıfırla */}
          <div className="hifz-controls" data-reveal="fade">
            <div className="hifz-filters" role="group" aria-label={t.filterLabel}>
              {['all','memorized','inProgress','notStarted'].map(f => (
                <button type="button" key={f} className="ui-chip hifz-filter-btn"
                  aria-pressed={filter===f} onClick={() => setFilter(f)}>
                  {t[f]}
                  <span className="hifz-filter-count ui-num">
                    {f==='all' ? 114 : f==='memorized' ? stats.memorized : f==='inProgress' ? stats.inProg : stats.notStarted}
                  </span>
                </button>
              ))}
            </div>
            {/* Sıfırlanacaq heç nə yoxdursa düymə söndürülür */}
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm hifz-reset-btn" onClick={handleReset} disabled={!hasProgress}>
              <Icon name="refresh" className="ui-btn__icon" />{t.reset}
            </button>
          </div>

          {/* Toxunuş nə edir — statuslar ardıcıllığı (ərəbcədə ox sağdan sola) */}
          <p className="hifz-hint">
            <Icon name="info" size={16} className="hifz-hint__icon" />
            <span>{t.hint}: {sl.join(lang === 'ar' ? ' ← ' : ' → ')}</span>
          </p>

          {/* Surə şəbəkəsi — telefonda qruplaşdırılmış siyahı; data-reveal="stagger" */}
          <div className="hifz-grid" data-reveal="stagger">
            {filtered.map((s) => {
              const st = getStatus(s.num)
              const bumped = bump.num === s.num ? (bump.n % 2 ? ' is-bump-a' : ' is-bump-b') : ''
              return (
                <button type="button" key={s.num} className={`hifz-card ${statusClass(st)}${bumped}`}
                  onClick={() => cycleStatus(s.num)}
                  title={sl[st]}>
                  {/* Əlçatan ad kartın görünən mətnindən qurulur (əvvəl aria-label
                      görünən mətni — ayə sayı, cüz, ərəb adı — əhatə etmirdi:
                      WCAG 2.5.3); status ekran oxuyucusu üçün sonda */}
                  <span className="hifz-card-num ui-num">{s.num}</span>
                  <span className={`hifz-card-body${lang === 'ar' ? ' is-ar' : ''}`}>
                    {/* Ərəbcədə latın adı artıqdır — ərəb adı başlıqdır */}
                    {lang !== 'ar' && <span className="hifz-card-en">{localName(s)}</span>}
                    <span className="hifz-card-meta">
                      <span>{ayahCountText(s.ayahs, lang, HIFZ_AYAH_WORDS)}</span>
                      <span>{t.juz} {s.juz}</span>
                    </span>
                    <span className="hifz-card-arabic" lang="ar">{s.name}</span>
                  </span>
                  {/* Status dairəsi: boş → yarım (davam edir) → ✓ (əzbər) */}
                  <span className={`m-check hifz-check${st === 2 ? ' is-checked' : st === 1 ? ' is-partial' : ''}${bumped && st === 2 ? ' is-celebrate' : ''}`} aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M6.5 12.5l3.8 3.8L17.5 8.5"/></svg>
                  </span>
                  <span className="ui-sr-only"> — {sl[st]}</span>
                </button>
              )
            })}
          </div>
          {/* Süzgəcdə surə yoxdursa — boş ekran əvəzinə izah */}
          {filtered.length === 0 && (
            <div className="hifz-empty" role="status">
              <span className="ui-icon-tile ui-icon-tile--lg" aria-hidden="true"><Icon name="hifz" /></span>
              <p>{t.empty}</p>
            </div>
          )}

        </div>
      </section>

      <DeferRender height="620px" idle={false} rootMargin="400px 0px">
        <Suspense fallback={<div style={{ minHeight: 620 }} />}>
          <TwinAyahs lang={lang} />
        </Suspense>
      </DeferRender>

      <HifzMethod lang={lang} />
    </>
  )
}

// ── "Necə əzbərləmək": addımlar + dəlillər (data/guides/HifzPage.js) ──
function HifzMethod({ lang }) {
  const navigate = useNavigate()
  const M = HIFZ_GUIDE.method
  const quranHref = `${pathFor('quran', lang)}#qp-about`
  return (
    <section className="ui-section hifz-method ui-cv" style={{ '--cv-h': '900px' }} id="hifz-method" aria-labelledby="hifz-method-title">
      <div className="ui-container">
        <div className="ui-section-head" data-reveal="">
          <span className="ui-eyebrow">{pk(M.eyebrow, lang)}</span>
          <h2 id="hifz-method-title" className="ui-title">{pk(M.title, lang)}</h2>
          <p className="ui-lead">{pk(M.lead, lang)}</p>
        </div>
        <div className="hifz-method__grid">
          <ol className="ui-steps">
            {M.steps.map((st, i) => (
              <li key={i} className="ui-step">
                <span className="ui-step__n" aria-hidden="true">{i + 1}</span>
                <div className="ui-step__body">
                  <h3 className="ui-step__title">{pk(st.title, lang)}</h3>
                  <p className="ui-step__text">{pk(st.text, lang)}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="hifz-method__quotes">
            {M.quotes.map((q, i) => (
              <figure key={i} className="ui-quote hifz-quote">
                <blockquote>
                  <p className="ui-quote__ar ui-arabic" lang="ar" dir="rtl">{q.ar}</p>
                  {lang !== 'ar' && <p className="ui-quote__text">{pk(q.text, lang)}</p>}
                </blockquote>
                <figcaption className="ui-quote__src">
                  {q.kind === 'quran'
                    ? <>{pk(HIFZ_GUIDE.quran, lang)}, <a dir="ltr" className="hifz-quote__ref" href={`${pathFor('quran', lang, 54)}?a=17`}>{q.ref}</a></>
                    : <><cite>{pk(q.src, lang)}</cite>{q.grade && <> · {pk(HIFZ_GUIDE.grade, lang)}: {pk(q.grade, lang)}</>}</>}
                </figcaption>
              </figure>
            ))}
            <ul className="ui-list">
              <li>
                <a className="ui-list__item" href={quranHref} onClick={e => { if (!isPlainClick(e)) return; e.preventDefault(); navigate(quranHref) }}>
                  <Icon name="quran" size={18} />
                  <span>{pk(M.more, lang)}<small>{pk(M.moreText, lang)}</small></span>
                  <Icon name="chevron" size={16} className="ui-list__chev ui-flip-rtl" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
