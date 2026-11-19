// ═══════════════════════════════════════════════════════
// Yolda rejimi — "Quran dinlə" paneli (/on-the-road)
//
// • Səs — saytın öz pleyeri (useQuranPlayer, səhifədə yaradılır ki, başqa panelə keçəndə
//   qiraət dayanmasın): sevimli qari (utils/quranAudio → readAudioPrefs().reciter), Media Session
//   (qulaqlıq/avtomobil düymələri), ehtiyat mənbələr. Mətn göstərilmir — yalnız surə və ayə nömrəsi.
// • Quran HEÇ VAXT nitq sintezi ilə oxunmur — yalnız həqiqi qiraət səsi.
// • "Davam et" nöqtəsi: bu rejimdə son dinlənən yer, yoxdursa Quran oxuyucusunun əlfəcini.
// ═══════════════════════════════════════════════════════
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import { AYAH_COUNTS } from '../../utils/quranMap'
import { surahLabel } from '../hifz/surahLabel'
import { PLAYER_LABELS } from '../QuranPlayer'

const T = {
  az: {
    play: 'Oxut', pause: 'Dayandır', prev: 'Əvvəlki ayə', next: 'Növbəti ayə', surah: 'Surə',
    verse: (n, total) => `Ayə ${n} / ${total}`, from: (name, n) => `Davam: ${name}, ayə ${n}`,
    reciter: 'Qari', reciterHint: 'Sevimli qarini hesab səhifəsində və ya Quran pleyerində dəyişə bilərsiniz.',
  },
  en: {
    play: 'Play', pause: 'Pause', prev: 'Previous verse', next: 'Next verse', surah: 'Surah',
    verse: (n, total) => `Verse ${n} of ${total}`, from: (name, n) => `Continue: ${name}, verse ${n}`,
    reciter: 'Reciter', reciterHint: 'You can change your favourite reciter on the account page or in the Quran player.',
  },
  ru: {
    play: 'Слушать', pause: 'Пауза', prev: 'Предыдущий аят', next: 'Следующий аят', surah: 'Сура',
    verse: (n, total) => `Аят ${n} из ${total}`, from: (name, n) => `Продолжить: ${name}, аят ${n}`,
    reciter: 'Чтец', reciterHint: 'Любимого чтеца можно сменить на странице аккаунта или в плеере Корана.',
  },
  ar: {
    play: 'تشغيل', pause: 'إيقاف مؤقت', prev: 'الآية السابقة', next: 'الآية التالية', surah: 'السورة',
    verse: (n, total) => `الآية ${n} من ${total}`, from: (name, n) => `متابعة: ${name}، الآية ${n}`,
    reciter: 'القارئ', reciterHint: 'يمكنك تغيير قارئك المفضل من صفحة الحساب أو من مشغل القرآن.',
  },
  tr: {
    play: 'Dinle', pause: 'Duraklat', prev: 'Önceki ayet', next: 'Sonraki ayet', surah: 'Sure',
    verse: (n, total) => `Ayet ${n} / ${total}`, from: (name, n) => `Devam: ${name}, ${n}. ayet`,
    reciter: 'Kâri', reciterHint: 'Sevdiğiniz kâriyi hesap sayfasında veya Kur’an oynatıcısında değiştirebilirsiniz.',
  },
}

const SURAHS = Array.from({ length: 114 }, (_, i) => i + 1)

/**
 * player — useQuranPlayer(); surah — açıq surə; ayah — oxunmayanda göstərilən (başlanğıc) ayə;
 * onSurah(n) — surə seçildi; onAyah(n) — başlanğıc ayə dəyişdi (oxunmayanda ←/→)
 */
export default function RoadQuran({ player, surah, ayah, lang, onSurah, onAyah }) {
  const t = pickUi(T, lang, 'en')
  const pl = pickUi(PLAYER_LABELS, lang, 'en')
  const total = AYAH_COUNTS[(surah || 1) - 1]
  const cur = player.current ?? ayah ?? 1
  const playing = player.status === 'playing' || player.status === 'loading'
  const name = surahLabel(surah || 1, lang)

  const onPlay = () => {
    if (player.current == null) player.start(cur)
    else player.toggle()
  }
  const step = (d) => {
    const n = Math.min(total, Math.max(1, cur + d))
    if (player.current == null) onAyah(n)
    else if (d > 0) player.next()
    else player.prev()
  }

  return (
    <div className="road-quran">
      <label className="road-field">
        <span className="road-field__label">{t.surah}</span>
        <select className="road-select" value={surah || 1} onChange={(e) => onSurah(Number(e.target.value))} data-testid="road-surah">
          {SURAHS.map((n) => <option key={n} value={n}>{n}. {surahLabel(n, lang)}</option>)}
        </select>
      </label>

      <p className="road-big-line">
        <b>{name}</b>
        <span className="ui-num">{t.verse(cur, total)}</span>
      </p>
      {player.current == null && ayah > 1 && <p className="road-sub">{t.from(name, ayah)}</p>}

      <div className="road-ctrl">
        <button type="button" className="road-btn road-btn--round" onClick={() => step(-1)} disabled={cur <= 1} aria-label={t.prev}>
          <Icon name="chevronLeft" size={36} className="ui-flip-rtl" />
        </button>
        <button type="button" className="road-btn road-btn--play" onClick={onPlay} aria-label={playing ? t.pause : t.play} aria-pressed={playing} data-testid="road-play">
          <Icon name={playing ? 'pause' : 'play'} size={56} />
        </button>
        <button type="button" className="road-btn road-btn--round" onClick={() => step(1)} disabled={cur >= total} aria-label={t.next}>
          <Icon name="chevron" size={36} className="ui-flip-rtl" />
        </button>
      </div>

      {player.status === 'loading' && <p className="road-sub" role="status">{pl.loading}</p>}
      {player.status === 'error' && (
        <div className="road-error">
          <p>{player.errorKind === 'offline' ? pl.errOffline : pl.errLoad}</p>
          <button type="button" className="road-btn road-btn--wide" onClick={() => player.retry()}>
            <Icon name="refresh" size={24} /> {pl.retry}
          </button>
        </div>
      )}

      <p className="road-sub road-reciter">
        <Icon name="volume" size={18} /> {t.reciter}: <b>{player.reciterLabel}</b>
      </p>
      <p className="road-hint">{t.reciterHint}</p>
    </div>
  )
}
