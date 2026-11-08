// ═══════════════════════════════════════════════════════
// MakkahLive (v5.8) — Məscidül-Haramdan rəsmi 24 saatlıq canlı yayım (/holyplaces)
//
// • Mənbə: YouTube-da «KSA Qur’an TV»nin rəsmi kanalı (@SaudiQuranTv,
//   UCos52azQNBgW63_9uDJoPDA — Səudiyyə Yayım Təşkilatının nəzarətində; 2026-11-08 yoxlanılıb).
//   Kanalın "live_stream" ünvanı — video dəyişsə də həmişə indiki yayım açılır.
// • Səhifə açılanda YouTube YÜKLƏNMİR (sürət, məxfilik): əvvəl sadə önizləmə,
//   "Canlı bax" basılanda youtube-nocookie iframe (səssiz başlayır — brauzer qaydası).
// ═══════════════════════════════════════════════════════
import { useState } from 'react'
import Icon from '../Icon'
import { pickUi } from '../../utils/uiText'
import './MakkahLive.css'

const CHANNEL = 'UCos52azQNBgW63_9uDJoPDA'
const T = {
  az: { live: 'CANLI', title: 'Məscidül-Haram — canlı', lead: 'Kəbənin ətrafında təvaf indi — Səudiyyə Quran kanalının rəsmi 24 saatlıq yayımı.', watch: 'Canlı bax', note: 'Yayım YouTube-dan açılır (rəsmi kanal: KSA Qur’an TV).' },
  en: { live: 'LIVE', title: 'Masjid al-Haram — live', lead: 'Tawaf around the Kaaba right now — the official 24-hour broadcast of the Saudi Quran channel.', watch: 'Watch live', note: 'The stream opens from YouTube (official channel: KSA Qur’an TV).' },
  // lang-ok[KSA Qur’an TV,Qur’an]: kanalın rəsmi adı
  ru: { live: 'ПРЯМОЙ ЭФИР', title: 'Запретная мечеть — прямой эфир', lead: 'Таваф вокруг Каабы прямо сейчас — официальная круглосуточная трансляция саудовского канала «Коран».', watch: 'Смотреть', note: 'Трансляция открывается с YouTube (официальный канал KSA Qur’an TV).' },
  ar: { live: 'مباشر', title: 'المسجد الحرام — بث مباشر', lead: 'الطواف حول الكعبة الآن — البث الرسمي على مدار الساعة لقناة القرآن الكريم السعودية.', watch: 'شاهد البث', note: 'يُفتح البث من يوتيوب (القناة الرسمية: قناة القرآن الكريم السعودية).' },
  // lang-ok[KSA Qur’an TV,Qur’an]: kanalın rəsmi adı
  tr: { live: 'CANLI', title: 'Mescid-i Haram — canlı', lead: 'Kâbe’nin etrafında tavaf şu an — Suudi Kur’an kanalının resmî 24 saatlik yayını.', watch: 'Canlı izle', note: 'Yayın YouTube’dan açılır (resmî kanal: KSA Qur’an TV).' },
}

export default function MakkahLive({ lang = 'az' }) {
  const t = pickUi(T, lang)
  const [on, setOn] = useState(false)
  const src = `https://www.youtube-nocookie.com/embed/live_stream?channel=${CHANNEL}&autoplay=1&mute=1&playsinline=1&rel=0`
  return (
    <figure className="ui-card mkl" data-testid="makkah-live">
      <div className="mkl__stage">
        {on ? (
          <iframe src={src} title={t.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
        ) : (
          <button type="button" className="mkl__poster" onClick={() => setOn(true)} data-testid="mkl-watch">
            <span className="mkl__badge"><i /> {t.live}</span>
            <span className="mkl__kaaba" aria-hidden="true" />
            <span className="mkl__play"><Icon name="play" size={26} /></span>
            <span className="mkl__cta">{t.watch}</span>
          </button>
        )}
      </div>
      <figcaption className="mkl__cap">
        <b>{t.title}</b>
        <span>{t.lead}</span>
        <small>{t.note}</small>
      </figcaption>
    </figure>
  )
}
